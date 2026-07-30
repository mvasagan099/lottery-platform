/**
 * Payment Routes
 * - Stripe & PayPal webhooks (with signature verification)
 * - Payment method management (with field whitelisting)
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import crypto from 'crypto'
import https from 'https'
import { prisma } from '../server'
import { authenticate, requireAdmin } from '../middleware/auth'

// Whitelisted fields for payment method create/update
const paymentMethodSchema = z.object({
  gateway: z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  fees: z.number().min(0).max(1), // 0 = free, 1 = 100%
  isActive: z.boolean(),
})

// ── PayPal IP allowlist ────────────────────────────────────────────────────────
// Source: https://www.paypal.com/us/smarthelp/article/what-are-the-ip-addresses-for-live-paypal-IPN
const PAYPAL_IP_RANGES: Array<[number, number, number]> = [
  [0x40_04_F0_00, 24, 0],  // 64.4.240.0/24
  [0x40_04_F1_00, 24, 0],  // 64.4.241.0/24
  [0xAD_00_50_00, 20, 0],  // 173.0.80.0/20
  [0xAD_00_54_00, 22, 0],  // 173.0.84.0/22
]

/** Correct CIDR membership test using bitwise arithmetic */
function isPayPalIP(ip: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return false
  const ipInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
  return PAYPAL_IP_RANGES.some(([network, prefix]) => {
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
    return (ipInt >>> 0 & mask) === (network & mask)
  })
}

// ── PayPal webhook signature verification (CRIT-06) ───────────────────────────
/** In-memory cert cache with TTL to avoid repeated HTTPS fetches */
const certCache = new Map<string, { pem: string; expiresAt: number }>()
const CERT_TTL_MS = 60 * 60 * 1000 // 1 hour

/** Fetch PayPal's public signing certificate (with in-memory cache) */
async function fetchPayPalCert(certUrl: string): Promise<string> {
  const cached = certCache.get(certUrl)
  if (cached && cached.expiresAt > Date.now()) return cached.pem

  // Only allow PayPal's own cert domain
  if (!certUrl.startsWith('https://api.paypal.com/') && !certUrl.startsWith('https://api.sandbox.paypal.com/')) {
    throw new Error('Invalid PayPal cert URL — must be from api.paypal.com')
  }

  return new Promise((resolve, reject) => {
    https.get(certUrl, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch PayPal cert: HTTP ${res.statusCode}`))
      }
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        certCache.set(certUrl, { pem: data, expiresAt: Date.now() + CERT_TTL_MS })
        resolve(data)
      })
    }).on('error', reject)
  })
}

/**
 * Verify PayPal webhook signature using RSA-SHA256.
 * PayPal signs: transmissionId|transmissionTime|webhookId|crc32(rawBody)
 */
async function verifyPayPalSignature(headers: Record<string, string | string[] | undefined>, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) throw new Error('PAYPAL_WEBHOOK_ID environment variable is not set')

  const transmissionId  = headers['paypal-transmission-id'] as string
  const transmissionTime = headers['paypal-transmission-time'] as string
  const certUrl         = headers['paypal-cert-url'] as string
  const transmissionSig = headers['paypal-transmission-sig'] as string
  const authAlgo        = (headers['paypal-auth-algo'] as string) || 'SHA256withRSA'

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
    throw new Error('Missing required PayPal signature headers')
  }

  // Compute CRC32 of the raw body
  const crc32 = computeCrc32(rawBody)

  // Build the message PayPal signed
  const message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32}`

  const cert = await fetchPayPalCert(certUrl)

  // Map PayPal algo names to Node crypto names
  const nodeAlgo = authAlgo.replace('withRSA', '').replace('SHA', 'SHA-').replace('SHA-256', 'SHA256')

  const verify = crypto.createVerify(nodeAlgo || 'SHA256')
  verify.update(message)
  return verify.verify(cert, transmissionSig, 'base64')
}

/** Standard CRC-32 implementation (IEEE 802.3 polynomial) */
function computeCrc32(str: string): number {
  const buf = Buffer.from(str, 'utf8')
  let crc = 0xFFFFFFFF
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

export default async function paymentRoutes(app: FastifyInstance) {

  // GET /payments/methods - Available payment methods
  app.get('/methods', async (request, reply) => {
    const methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: {
        id: true,
        gateway: true,
        name: true,
        description: true,
        minAmount: true,
        maxAmount: true,
        fees: true,
      },
    })

    return reply.send({ success: true, data: methods })
  })

  // GET /payments/methods/all - All payment methods (admin)
  app.get('/methods/all', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { gateway: 'asc' },
    })
    return reply.send({ success: true, data: methods })
  })

  // POST /payments/methods - Create payment method (admin) — HIGH-02: field whitelist
  app.post('/methods', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const data = paymentMethodSchema.parse(request.body) as any
    const method = await prisma.paymentMethod.create({ data })
    return reply.status(201).send({ success: true, data: method })
  })

  // PUT /payments/methods/:id - Update payment method (admin) — HIGH-02: field whitelist
  app.put('/methods/:id', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = paymentMethodSchema.partial().parse(request.body) as any
    const method = await prisma.paymentMethod.update({ where: { id }, data })
    return reply.send({ success: true, data: method })
  })

  // POST /payments/stripe/webhook - Stripe webhook with signature verification (CRIT-03)
  app.post('/stripe/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!sig || !webhookSecret) {
      request.log.warn('Stripe webhook: missing signature or secret')
      return reply.status(400).send({ error: 'Missing webhook configuration' })
    }

    let event: Stripe.Event
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      event = stripe.webhooks.constructEvent(
        (request as any).rawBody as Buffer,
        sig as string,
        webhookSecret
      )
    } catch (err: any) {
      request.log.warn(`Stripe webhook signature verification failed: ${err.message}`)
      return reply.status(400).send({ error: 'Invalid webhook signature' })
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent
          const deposit = await prisma.deposit.findFirst({
            where: { gatewayRef: pi.id, status: 'PENDING' },
            include: { wallet: true },
          })

          if (deposit) {
            await prisma.$transaction(async (tx) => {
              await tx.deposit.update({
                where: { id: deposit.id },
                data: { status: 'COMPLETED', processedAt: new Date() },
              })

              const balBefore = Number(deposit.wallet.balance)
              const amount = Number(deposit.amount)

              await tx.wallet.update({
                where: { id: deposit.walletId },
                data: {
                  balance: { increment: amount },
                  totalDeposited: { increment: amount },
                },
              })

              await tx.transaction.create({
                data: {
                  userId: deposit.wallet.userId,
                  walletId: deposit.walletId,
                  type: 'DEPOSIT',
                  status: 'COMPLETED',
                  amount,
                  balanceBefore: balBefore,
                  balanceAfter: balBefore + amount,
                  reference: `STRIPE-${pi.id.substring(0, 8)}`,
                  description: 'Stripe deposit',
                },
              })
            })

            await prisma.notification.create({
              data: {
                userId: deposit.wallet.userId,
                title: 'Deposit confirmed',
                message: `$${deposit.amount} USD has been added to your wallet.`,
              },
            })
          }
          break
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent
          await prisma.deposit.updateMany({
            where: { gatewayRef: pi.id },
            data: { status: 'FAILED' },
          })
          break
        }
      }

      return reply.send({ received: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // POST /payments/paypal/webhook - PayPal webhook with RSA-SHA256 signature verification (CRIT-06)
  app.post('/paypal/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    // Layer 1: IP allowlist
    const clientIp = request.ip
    if (!isPayPalIP(clientIp)) {
      request.log.warn(`PayPal webhook from non-allowlisted IP: ${clientIp}`)
      return reply.status(403).send({ error: 'Forbidden' })
    }

    // Layer 2: Cryptographic RSA-SHA256 signature verification
    try {
      const rawBody = (request as any).rawBody as Buffer | undefined
      if (!rawBody) {
        return reply.status(400).send({ error: 'Raw body not available — ensure rawBody plugin is enabled' })
      }

      const isValid = await verifyPayPalSignature(
        request.headers as Record<string, string | string[] | undefined>,
        rawBody.toString('utf8'),
      )

      if (!isValid) {
        request.log.warn('PayPal webhook: signature verification failed')
        return reply.status(400).send({ error: 'Invalid PayPal webhook signature' })
      }
    } catch (sigErr: any) {
      request.log.warn(`PayPal webhook signature error: ${sigErr.message}`)
      return reply.status(400).send({ error: 'Webhook signature verification failed' })
    }

    // Layer 3: Process the verified event
    const event = request.body as any

    try {
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const captureId = event.resource?.id
        if (!captureId) {
          return reply.status(400).send({ error: 'Missing capture ID' })
        }

        const deposit = await prisma.deposit.findFirst({
          where: { gatewayRef: captureId, status: 'PENDING' },
          include: { wallet: true },
        })

        if (deposit) {
          const balBefore = Number(deposit.wallet.balance)
          const amount = Number(deposit.amount)

          await prisma.$transaction(async (tx) => {
            await tx.deposit.update({
              where: { id: deposit.id },
              data: { status: 'COMPLETED', processedAt: new Date() },
            })

            await tx.wallet.update({
              where: { id: deposit.walletId },
              data: {
                balance: { increment: amount },
                totalDeposited: { increment: amount },
              },
            })

            await tx.transaction.create({
              data: {
                userId: deposit.wallet.userId,
                walletId: deposit.walletId,
                type: 'DEPOSIT',
                status: 'COMPLETED',
                amount,
                balanceBefore: balBefore,
                balanceAfter: balBefore + amount,
                reference: `PP-${captureId.substring(0, 8)}`,
                description: 'PayPal deposit',
              },
            })
          })
        }
      }

      return reply.send({ received: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // GET /payments/withdrawals/pending - Pending withdrawals (admin)
  app.get('/withdrawals/pending', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100)
    const skip = (Math.max(1, Number(page) || 1) - 1) * limitNum

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'asc' },
        include: {
          wallet: {
            include: {
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    ])

    return reply.send({
      success: true,
      data: withdrawals,
      pagination: { page: Math.max(1, Number(page) || 1), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  })

  // POST /payments/withdrawals/:id/approve - Approve withdrawal (admin)
  app.post('/withdrawals/:id/approve', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    })

    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Withdrawal not found or not pending' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          reviewedById: request.user.userId,
          processedAt: new Date(),
        },
      })

      const balBefore = Number(withdrawal.wallet.balance) + Number(withdrawal.wallet.pendingBalance)
      const amount = Number(withdrawal.amount)

      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          pendingBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      })

      await tx.transaction.create({
        data: {
          userId: withdrawal.wallet.userId,
          walletId: withdrawal.walletId,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          amount: -amount,
          balanceBefore: balBefore,
          balanceAfter: balBefore - amount,
          reference: `WD-${id.substring(0, 8).toUpperCase()}`,
          description: `Withdrawal via ${withdrawal.gateway}`,
        },
      })
    })

    await prisma.notification.create({
      data: {
        userId: withdrawal.wallet.userId,
        title: 'Withdrawal processed',
        message: `Your withdrawal of $${withdrawal.amount} USD has been processed.`,
      },
    })

    return reply.send({ success: true, message: 'Withdrawal approved and processed' })
  })

  // POST /payments/withdrawals/:id/reject - Reject withdrawal (admin)
  app.post('/withdrawals/:id/reject', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { reason } = request.body as { reason: string }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    })

    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Withdrawal not found or not pending' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          reviewedById: request.user.userId,
          reviewNotes: reason,
        },
      })

      // Return funds to main balance
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balance: { increment: Number(withdrawal.amount) },
          pendingBalance: { decrement: Number(withdrawal.amount) },
        },
      })
    })

    await prisma.notification.create({
      data: {
        userId: withdrawal.wallet.userId,
        title: 'Withdrawal rejected',
        message: `Your withdrawal of $${withdrawal.amount} USD was rejected. Funds have been returned to your wallet. Reason: ${reason}`,
      },
    })

    return reply.send({ success: true, message: 'Withdrawal rejected' })
  })
}
