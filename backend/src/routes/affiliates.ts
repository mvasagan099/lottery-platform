/**
 * Affiliate & Referral Routes
 * - Affiliate dashboard, commissions, referral tracking
 */

import { FastifyInstance } from 'fastify'
import { prisma } from '../server'
import { authenticate, requireAdmin } from '../middleware/auth'

export default async function affiliateRoutes(app: FastifyInstance) {

  // GET /affiliates/me - Get affiliate profile & stats
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user.userId

    let affiliate = await prisma.affiliateAccount.findUnique({
      where: { userId },
      include: {
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    // Auto-create affiliate account if doesn't exist
    if (!affiliate) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
      affiliate = await prisma.affiliateAccount.create({
        data: {
          userId,
          affiliateCode: user!.referralCode,
        },
        include: { commissions: true },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    })

    return reply.send({
      success: true,
      data: {
        ...affiliate,
        referralCode: user?.referralCode,
        referralLink: `${process.env.FRONTEND_URL}?ref=${user?.referralCode}`,
      },
    })
  })

  // GET /affiliates/commissions - Commission history (paginated)
  app.get('/commissions', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20', type } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const affiliate = await prisma.affiliateAccount.findUnique({
      where: { userId: request.user.userId },
    })

    if (!affiliate) {
      return reply.send({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } })
    }

    const where: any = { affiliateId: affiliate.id }
    if (type) where.type = type

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.affiliateCommission.count({ where }),
    ])

    return reply.send({
      success: true,
      data: commissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  })

  // GET /affiliates/referrals - List referred users
  app.get('/referrals', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const [referrals, total] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: request.user.userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          status: true,
          wallet: { select: { totalDeposited: true } },
        },
      }),
      prisma.user.count({ where: { referredById: request.user.userId } }),
    ])

    return reply.send({
      success: true,
      data: referrals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  })

  // GET /affiliates/stats - Detailed affiliate stats
  app.get('/stats', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user.userId

    const affiliate = await prisma.affiliateAccount.findUnique({
      where: { userId },
    })

    if (!affiliate) {
      return reply.send({ success: true, data: { totalEarned: 0, pending: 0, clicks: 0, signups: 0 } })
    }

    const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [recentCommissions, monthlyReferrals] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where: { affiliateId: affiliate.id, createdAt: { gte: last30days } },
        select: { amount: true, type: true, createdAt: true },
      }),
      prisma.user.count({
        where: { referredById: userId, createdAt: { gte: last30days } },
      }),
    ])

    const monthlyEarnings = recentCommissions.reduce((s, c) => s + Number(c.amount), 0)

    return reply.send({
      success: true,
      data: {
        totalEarned: affiliate.totalEarned,
        totalPaid: affiliate.totalPaid,
        pendingAmount: affiliate.pendingAmount,
        totalClicks: affiliate.totalClicks,
        totalSignups: affiliate.totalSignups,
        totalDeposits: affiliate.totalDeposits,
        commissionRate: affiliate.commissionRate,
        monthlyEarnings,
        monthlyReferrals,
        recentCommissions,
      },
    })
  })

  // ── Admin Affiliate Management ─────────────────────────────────────────────

  // GET /affiliates/admin/all - List all affiliates (admin)
  app.get('/admin/all', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const [affiliates, total] = await Promise.all([
      prisma.affiliateAccount.findMany({
        skip,
        take: Number(limit),
        orderBy: { totalEarned: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.affiliateAccount.count(),
    ])

    return reply.send({
      success: true,
      data: affiliates,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // PATCH /affiliates/admin/:id/commission - Update commission rate (admin)
  app.patch('/admin/:id/commission', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { rate } = request.body as { rate: number }

    if (rate < 0 || rate > 100) {
      return reply.status(400).send({ success: false, error: 'Rate must be between 0 and 100' })
    }

    const affiliate = await prisma.affiliateAccount.update({
      where: { id },
      data: { commissionRate: rate },
    })

    return reply.send({ success: true, data: affiliate })
  })

  // POST /affiliates/admin/:id/pay - Mark commissions as paid (admin)
  app.post('/admin/:id/pay', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const affiliate = await prisma.affiliateAccount.findUnique({ where: { id } })
    if (!affiliate) return reply.status(404).send({ success: false, error: 'Affiliate not found' })

    const pendingAmount = Number(affiliate.pendingAmount)
    if (pendingAmount === 0) {
      return reply.status(400).send({ success: false, error: 'No pending commissions to pay' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.affiliateCommission.updateMany({
        where: { affiliateId: id, isPaid: false },
        data: { isPaid: true, paidAt: new Date() },
      })

      await tx.affiliateAccount.update({
        where: { id },
        data: {
          totalPaid: { increment: pendingAmount },
          pendingAmount: 0,
        },
      })
    })

    return reply.send({ success: true, message: `$${pendingAmount.toFixed(2)} paid to affiliate` })
  })
}
