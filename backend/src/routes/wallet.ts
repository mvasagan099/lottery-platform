/**
 * Wallet Routes
 * - Balance, deposits, withdrawals, transaction history
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate, requireVerifiedEmail, auditLog } from '../middleware/auth'

const depositSchema = z.object({
  amount: z.number().positive().min(10).max(10000),
  gateway: z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']),
  paymentMethodId: z.string().optional(),
})

const withdrawalSchema = z.object({
  amount: z.number().positive().min(10).max(50000),
  gateway: z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER']),
  accountDetails: z.object({
    accountName: z.string(),
    accountNumber: z.string().optional(),
    bsb: z.string().optional(),
    paypalEmail: z.string().email().optional(),
  }),
})

const redeemSchema = z.object({
  code: z.string().min(3).max(50),
})

export default async function walletRoutes(app: FastifyInstance) {

  // GET /wallet - Get wallet info
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: request.user.userId },
      select: {
        id: true,
        balance: true,
        bonusBalance: true,
        pendingBalance: true,
        currency: true,
        totalDeposited: true,
        totalWithdrawn: true,
        totalWon: true,
        totalSpent: true,
      },
    })

    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    return reply.send({ success: true, data: wallet })
  })

  // GET /wallet/transactions - Transaction history
  app.get('/transactions', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20', type, status } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { userId: request.user.userId }
    if (type) where.type = type
    if (status) where.status = status

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          currency: true,
          reference: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return reply.send({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  })

  // POST /wallet/deposit - Initiate deposit
  app.post('/deposit', {
    preHandler: [authenticate, requireVerifiedEmail],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const body = depositSchema.parse(request.body)
    const userId = request.user.userId

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    // Create pending deposit
    const deposit = await prisma.deposit.create({
      data: {
        walletId: wallet.id,
        amount: body.amount,
        gateway: body.gateway,
        status: 'PENDING',
      },
    })

    // In real implementation, initiate payment gateway here
    // For Stripe: create payment intent, return client secret
    // For now, return deposit ID for mock flow

    let gatewayData: any = { depositId: deposit.id }

    if (body.gateway === 'STRIPE') {
      // Mock Stripe payment intent
      gatewayData.clientSecret = `pi_mock_${deposit.id}_secret`
      gatewayData.amount = body.amount * 100 // cents
    } else if (body.gateway === 'PAYPAL') {
      gatewayData.approvalUrl = `https://paypal.com/checkoutnow?token=mock_${deposit.id}`
    } else if (body.gateway === 'BANK_TRANSFER') {
      gatewayData.bankDetails = {
        accountName: 'MegaDraw Pty Ltd',
        bsb: '123-456',
        accountNumber: '123456789',
        reference: `DEP-${deposit.id.substring(0, 8).toUpperCase()}`,
      }
    }

    await auditLog(userId, 'DEPOSIT_INITIATED', 'Deposit', deposit.id, undefined, { amount: body.amount, gateway: body.gateway }, request)

    return reply.status(201).send({
      success: true,
      message: 'Deposit initiated',
      data: { depositId: deposit.id, ...gatewayData },
    })
  })

  // POST /wallet/deposit/:id/confirm - Confirm deposit (webhook or manual)
  app.post('/deposit/:id/confirm', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { gatewayRef } = request.body as { gatewayRef?: string }
    const userId = request.user.userId

    const deposit = await prisma.deposit.findFirst({
      where: { id, wallet: { userId } },
      include: { wallet: true },
    })

    if (!deposit) return reply.status(404).send({ success: false, error: 'Deposit not found' })
    if (deposit.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Deposit already processed' })
    }

    await prisma.$transaction(async (tx) => {
      // Update deposit
      await tx.deposit.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          gatewayRef,
          processedAt: new Date(),
        },
      })

      const balBefore = Number(deposit.wallet.balance)
      const amount = Number(deposit.amount)

      // Credit wallet
      await tx.wallet.update({
        where: { id: deposit.walletId },
        data: {
          balance: { increment: amount },
          totalDeposited: { increment: amount },
        },
      })

      // Log transaction
      await tx.transaction.create({
        data: {
          userId,
          walletId: deposit.walletId,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount,
          balanceBefore: balBefore,
          balanceAfter: balBefore + amount,
          reference: `DEP-${id.substring(0, 8).toUpperCase()}`,
          description: `Deposit via ${deposit.gateway}`,
        },
      })
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Deposit confirmed',
        message: `$${deposit.amount} AUD has been added to your wallet.`,
      },
    })

    return reply.send({ success: true, message: 'Deposit confirmed' })
  })

  // POST /wallet/withdraw - Request withdrawal
  app.post('/withdraw', {
    preHandler: [authenticate, requireVerifiedEmail],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const body = withdrawalSchema.parse(request.body)
    const userId = request.user.userId

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    })

    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    if (Number(wallet.balance) < body.amount) {
      return reply.status(400).send({
        success: false,
        error: 'Insufficient balance for withdrawal',
      })
    }

    // Check KYC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    })

    if (user?.kycStatus !== 'APPROVED') {
      return reply.status(403).send({
        success: false,
        error: 'Identity verification required before withdrawing funds',
        code: 'KYC_REQUIRED',
      })
    }

    await prisma.$transaction(async (tx) => {
      // Create withdrawal request
      await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          amount: body.amount,
          gateway: body.gateway,
          accountDetails: body.accountDetails,
          status: 'PENDING',
        },
      })

      // Reserve funds
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: body.amount },
          pendingBalance: { increment: body.amount },
        },
      })
    })

    await auditLog(userId, 'WITHDRAWAL_REQUESTED', 'Withdrawal', undefined, undefined, { amount: body.amount }, request)

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Withdrawal request received',
        message: `Your withdrawal of $${body.amount} AUD is being processed.`,
      },
    })

    return reply.status(201).send({
      success: true,
      message: 'Withdrawal request submitted. Processing within 1-3 business days.',
    })
  })

  // GET /wallet/deposits - Deposit history
  app.get('/deposits', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const wallet = await prisma.wallet.findUnique({
      where: { userId: request.user.userId },
      select: { id: true },
    })

    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.deposit.count({ where: { walletId: wallet.id } }),
    ])

    return reply.send({
      success: true,
      data: deposits,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // GET /wallet/withdrawals - Withdrawal history
  app.get('/withdrawals', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const wallet = await prisma.wallet.findUnique({
      where: { userId: request.user.userId },
      select: { id: true },
    })

    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          amount: true,
          gateway: true,
          status: true,
          processedAt: true,
          createdAt: true,
        },
      }),
      prisma.withdrawal.count({ where: { walletId: wallet.id } }),
    ])

    return reply.send({
      success: true,
      data: withdrawals,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // POST /wallet/redeem - Redeem a coupon code
  app.post('/redeem', { preHandler: [authenticate, requireVerifiedEmail] }, async (request, reply) => {
    const body = redeemSchema.parse(request.body)
    const userId = request.user.userId

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return reply.status(404).send({ success: false, error: 'Wallet not found' })

    const codeUpper = body.code.trim().toUpperCase()

    // 1. Verify coupon via external API
    const verifyUrl = `${process.env.COUPON_API_URL}/coupons/verify`
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.COUPON_API_KEY || ''
      },
      body: JSON.stringify({
        couponCode: codeUpper,
        userId: userId,
        gameId: 'lottery-platform'
      })
    })
    
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok || !verifyData.success) {
      return reply.status(verifyRes.status === 404 ? 404 : 400).send({
        success: false,
        code: verifyData.code || 'INVALID_COUPON',
        error: verifyData.message || 'Failed to verify coupon'
      })
    }

    const amount = Number(verifyData.amount)
    const couponId = verifyData.couponId

    // 2. Credit Wallet
    let walletTransactionId = '';
    try {
      await prisma.$transaction(async (tx) => {
        const balBefore = Number(wallet.balance)

        // Credit wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount },
            totalDeposited: { increment: amount },
          },
        })

        // Log transaction
        const txn = await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount,
            balanceBefore: balBefore,
            balanceAfter: balBefore + amount,
            reference: `CPN-${codeUpper}-${Date.now()}`,
            description: 'Coupon Redemption',
          },
        })
        walletTransactionId = txn.id;
      })
    } catch (err) {
      return reply.status(500).send({ success: false, error: 'Failed to credit wallet' })
    }

    // 3. Redeem Coupon on Coupon Service
    const redeemUrl = `${process.env.COUPON_API_URL}/coupons/redeem`
    const redeemRes = await fetch(redeemUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.COUPON_API_KEY || ''
      },
      body: JSON.stringify({
        couponId,
        userId,
        gameId: 'lottery-platform',
        walletTransactionId
      })
    })

    const redeemData = await redeemRes.json()

    if (!redeemRes.ok || !redeemData.success) {
      // In a robust system, we would queue a compensation transaction here to reverse the wallet credit.
      // For now, log critically.
      console.error('CRITICAL: Wallet credited but coupon redemption failed on Coupon Service', {
        userId, couponId, walletTransactionId, error: redeemData
      })
      return reply.status(500).send({ success: false, error: 'Redemption failed during finalization. Contact support.' })
    }

    await auditLog(userId, 'COUPON_REDEEMED', 'Deposit', undefined, undefined, { code: codeUpper, amount }, request)

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Coupon Redeemed',
        message: `${amount.toFixed(2)} Coins have been added to your wallet.`,
      },
    })

    return reply.send({ success: true, message: 'Coupon redeemed successfully', data: { amount } })
  })
}
