/**
 * Payment Routes
 * - Stripe & PayPal webhooks
 * - Payment method management
 */

import { FastifyInstance } from 'fastify'
import { prisma } from '../server'
import { authenticate, requireAdmin } from '../middleware/auth'

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

  // POST /payments/methods - Create payment method (admin)
  app.post('/methods', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const data = request.body as any
    const method = await prisma.paymentMethod.create({ data })
    return reply.status(201).send({ success: true, data: method })
  })

  // PUT /payments/methods/:id - Update payment method (admin)
  app.put('/methods/:id', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const method = await prisma.paymentMethod.update({ where: { id }, data })
    return reply.send({ success: true, data: method })
  })

  // POST /payments/stripe/webhook - Stripe webhook handler
  app.post('/stripe/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!sig || !webhookSecret) {
      return reply.status(400).send({ error: 'Missing signature' })
    }

    // In production, verify Stripe signature:
    // const event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret)
    const event = request.body as any

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object
          // Find deposit by gateway reference
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
                message: `$${deposit.amount} AUD has been added to your wallet.`,
              },
            })
          }
          break
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object
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

  // POST /payments/paypal/webhook - PayPal webhook handler
  app.post('/paypal/webhook', async (request, reply) => {
    const event = request.body as any

    try {
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const captureId = event.resource.id
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
    const skip = (Number(page) - 1) * Number(limit)

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        skip,
        take: Number(limit),
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
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
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
        message: `Your withdrawal of $${withdrawal.amount} AUD has been processed.`,
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
        message: `Your withdrawal of $${withdrawal.amount} AUD was rejected. Funds have been returned to your wallet. Reason: ${reason}`,
      },
    })

    return reply.send({ success: true, message: 'Withdrawal rejected' })
  })
}
