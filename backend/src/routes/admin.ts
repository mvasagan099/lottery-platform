/**
 * Admin Routes
 * - User management, KYC approvals, draw management
 * - Financial controls, reports, settings
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate, requireAdmin, auditLog } from '../middleware/auth'

export default async function adminRoutes(app: FastifyInstance) {

  // All admin routes require authentication + admin role
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireAdmin)

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  app.get('/stats', async (request, reply) => {
    const [
      totalUsers,
      activeUsers,
      pendingKYC,
      pendingWithdrawals,
      totalRevenue,
      todayTickets,
      activeSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.ticket.count({
        where: { purchasedAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      prisma.session.count({ where: { isActive: true, expiresAt: { gt: new Date() } } }),
    ])

    return reply.send({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        pendingKYC,
        pendingWithdrawals,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayTickets,
        activeSessions,
      },
    })
  })

  // ── User Management ───────────────────────────────────────────────────────

  app.get('/users', async (request, reply) => {
    const { page = '1', limit = '20', search, status, role } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (role) where.role = role

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          kycStatus: true,
          createdAt: true,
          lastLoginAt: true,
          wallet: { select: { balance: true, totalDeposited: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return reply.send({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        kycRecords: { orderBy: { submittedAt: 'desc' } },
        tickets: {
          orderBy: { purchasedAt: 'desc' },
          take: 10,
          include: { game: { select: { name: true } } },
        },
        sessions: {
          where: { isActive: true },
          select: { id: true, ipAddress: true, lastUsedAt: true },
        },
      },
    })

    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })

    const { passwordHash, twoFactorSecret, ...safeUser } = user
    return reply.send({ success: true, data: safeUser })
  })

  app.patch('/users/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, reason } = request.body as { status: string; reason?: string }

    const oldUser = await prisma.user.findUnique({ where: { id }, select: { status: true } })

    await prisma.user.update({ where: { id }, data: { status: status as any } })

    if (status === 'BANNED' || status === 'SUSPENDED') {
      await prisma.session.updateMany({ where: { userId: id }, data: { isActive: false } })
    }

    await auditLog(
      request.user.userId,
      'USER_STATUS_CHANGED',
      'User',
      id,
      { status: oldUser?.status },
      { status, reason },
      request
    )

    return reply.send({ success: true, message: `User ${status.toLowerCase()}` })
  })

  // ── KYC Management ────────────────────────────────────────────────────────

  app.get('/kyc', async (request, reply) => {
    const { page = '1', limit = '20', status = 'PENDING' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const [records, total] = await Promise.all([
      prisma.kYCRecord.findMany({
        where: { status: status as any },
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'asc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.kYCRecord.count({ where: { status: status as any } }),
    ])

    return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total } })
  })

  app.patch('/kyc/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = request.body as { status: 'APPROVED' | 'REJECTED'; notes?: string }

    const record = await prisma.kYCRecord.update({
      where: { id },
      data: {
        status,
        reviewedById: request.user.userId,
        reviewNotes: notes,
        reviewedAt: new Date(),
      },
    })

    // Update user KYC status
    await prisma.user.update({
      where: { id: record.userId },
      data: { kycStatus: status },
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId: record.userId,
        title: `Identity verification ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
        message: status === 'APPROVED'
          ? 'Your identity has been verified. You can now make withdrawals.'
          : `Your verification was rejected: ${notes || 'Please resubmit with clearer documents.'}`,
      },
    })

    await auditLog(request.user.userId, `KYC_${status}`, 'KYCRecord', id, undefined, { status, notes }, request)

    return reply.send({ success: true, message: `KYC ${status.toLowerCase()}` })
  })

  // ── Draw Management ───────────────────────────────────────────────────────

  app.get('/draws', async (request, reply) => {
    const { page = '1', limit = '20', status, gameId } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (status) where.status = status
    if (gameId) where.gameId = gameId

    const [draws, total] = await Promise.all([
      prisma.draw.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { scheduledAt: 'desc' },
        include: { game: { select: { name: true, slug: true } } },
      }),
      prisma.draw.count({ where }),
    ])

    return reply.send({ success: true, data: draws, pagination: { page: Number(page), limit: Number(limit), total } })
  })

  app.post('/draws/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { winningNumbers, supplementary, powerball } = request.body as {
      winningNumbers: number[]
      supplementary?: number[]
      powerball?: number
    }

    const draw = await prisma.draw.findUnique({
      where: { id },
      include: { game: true, tickets: { include: { numbers: true } } },
    })

    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })
    if (draw.status !== 'SCHEDULED') {
      return reply.status(400).send({ success: false, error: 'Draw already processed' })
    }

    // Process winning entries
    await prisma.$transaction(async (tx) => {
      await tx.draw.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          winningNumbers,
          supplementary,
          powerball,
          drawnAt: new Date(),
          verifiedById: request.user.userId,
        },
      })

      // Check all tickets against winning numbers
      for (const ticket of draw.tickets) {
        for (const line of ticket.numbers) {
          const nums = line.numbers as number[]
          const matchCount = nums.filter((n) => winningNumbers.includes(n)).length
          const hasSupp = supplementary ? (line.supplementary as number[] || []).some((s) => supplementary.includes(s)) : false
          const hasPB = powerball ? line.powerball === powerball : false

          // Determine division (simplified - real logic would use game rules)
          const divisionName = getDivision(draw.game, matchCount, hasSupp, hasPB)

          if (divisionName) {
            const prize = getPrizeForDivision(draw, divisionName)
            await tx.winningEntry.create({
              data: {
                ticketId: ticket.id,
                drawId: id,
                divisionName,
                prizeAmount: prize,
              },
            })

            await tx.ticket.update({
              where: { id: ticket.id },
              data: { status: 'WON', prizeDivision: divisionName, prizeAmount: prize },
            })
          } else {
            await tx.ticket.update({
              where: { id: ticket.id },
              data: { status: 'LOST' },
            })
          }
        }
      }

      await tx.draw.update({
        where: { id },
        data: { status: 'COMPLETED', publishedAt: new Date() },
      })
    })

    await auditLog(request.user.userId, 'DRAW_RUN', 'Draw', id, undefined, { winningNumbers }, request)

    return reply.send({ success: true, message: 'Draw completed and results published' })
  })

  // ── Game Management ───────────────────────────────────────────────────────

  app.get('/games', async (request, reply) => {
    const games = await prisma.game.findMany({
      include: {
        prizeDivisions: { orderBy: { divisionOrder: 'asc' } },
        _count: { select: { draws: true, tickets: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return reply.send({ success: true, data: games })
  })

  app.patch('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const updates = request.body as any

    const game = await prisma.game.update({ where: { id }, data: updates })

    await auditLog(request.user.userId, 'GAME_UPDATED', 'Game', id, undefined, updates, request)

    return reply.send({ success: true, data: game })
  })

  // ── Withdrawal Approval ───────────────────────────────────────────────────

  app.get('/withdrawals', async (request, reply) => {
    const { page = '1', limit = '20', status = 'PENDING' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: status as any },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'asc' },
        include: {
          wallet: {
            select: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.withdrawal.count({ where: { status: status as any } }),
    ])

    return reply.send({ success: true, data: withdrawals, pagination: { page: Number(page), limit: Number(limit), total } })
  })

  app.patch('/withdrawals/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    })

    if (!withdrawal) return reply.status(404).send({ success: false, error: 'Not found' })
    if (withdrawal.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Already processed' })
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
          balanceBefore: Number(withdrawal.wallet.pendingBalance),
          balanceAfter: 0,
          reference: `WDR-${id.substring(0, 8).toUpperCase()}`,
          description: `Withdrawal via ${withdrawal.gateway}`,
        },
      })
    })

    return reply.send({ success: true, message: 'Withdrawal approved' })
  })

  app.patch('/withdrawals/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { reason } = request.body as { reason: string }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    })

    if (!withdrawal) return reply.status(404).send({ success: false, error: 'Not found' })

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: 'FAILED', reviewedById: request.user.userId, reviewNotes: reason },
      })

      const amount = Number(withdrawal.amount)
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balance: { increment: amount },
          pendingBalance: { decrement: amount },
        },
      })
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId: withdrawal.wallet.userId,
        title: 'Withdrawal rejected',
        message: `Your withdrawal of $${withdrawal.amount} was rejected: ${reason}. Funds returned to your wallet.`,
      },
    })

    return reply.send({ success: true, message: 'Withdrawal rejected and funds returned' })
  })

  // ── Reports ───────────────────────────────────────────────────────────────

  app.get('/reports/revenue', async (request, reply) => {
    const { from, to } = request.query as { from?: string; to?: string }

    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const [deposits, withdrawals, ticketSales, prizes] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'TICKET_PURCHASE', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'PRIZE_CREDIT', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return reply.send({
      success: true,
      data: {
        deposits: { total: deposits._sum.amount || 0, count: deposits._count },
        withdrawals: { total: Math.abs(Number(withdrawals._sum.amount) || 0), count: withdrawals._count },
        ticketSales: { total: Math.abs(Number(ticketSales._sum.amount) || 0), count: ticketSales._count },
        prizes: { total: prizes._sum.amount || 0, count: prizes._count },
        netRevenue: (Number(ticketSales._sum.amount) || 0) - (Number(prizes._sum.amount) || 0),
      },
    })
  })

  // ── System Settings ───────────────────────────────────────────────────────

  app.get('/settings', async (request, reply) => {
    const settings = await prisma.setting.findMany({ orderBy: { group: 'asc' } })
    return reply.send({ success: true, data: settings })
  })

  app.patch('/settings', async (request, reply) => {
    const updates = request.body as Record<string, string>

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return reply.send({ success: true, message: 'Settings updated' })
  })

  // ── Banners / CMS ─────────────────────────────────────────────────────────

  app.get('/banners', async (request, reply) => {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    return reply.send({ success: true, data: banners })
  })

  app.post('/banners', async (request, reply) => {
    const data = request.body as any
    const banner = await prisma.banner.create({ data })
    return reply.status(201).send({ success: true, data: banner })
  })

  app.patch('/banners/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const banner = await prisma.banner.update({ where: { id }, data: request.body as any })
    return reply.send({ success: true, data: banner })
  })

  app.delete('/banners/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.banner.delete({ where: { id } })
    return reply.send({ success: true, message: 'Banner deleted' })
  })

  // ── Audit Logs ────────────────────────────────────────────────────────────

  app.get('/audit-logs', async (request, reply) => {
    const { page = '1', limit = '50', userId, action, resource } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (userId) where.userId = userId
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (resource) where.resource = resource

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, username: true } } },
      }),
      prisma.auditLog.count({ where }),
    ])

    return reply.send({ success: true, data: logs, pagination: { page: Number(page), limit: Number(limit), total } })
  })
}

// Helper: determine prize division based on matches
function getDivision(game: any, matchCount: number, hasSupp: boolean, hasPB: boolean): string | null {
  if (game.slug === 'powerball') {
    if (matchCount === 7 && hasPB) return 'Division 1'
    if (matchCount === 7) return 'Division 2'
    if (matchCount === 6 && hasPB) return 'Division 3'
    if (matchCount === 6) return 'Division 4'
    if (matchCount === 5 && hasPB) return 'Division 5'
    if (matchCount === 5) return 'Division 6'
    if (matchCount === 4 && hasPB) return 'Division 7'
    if (matchCount === 3 && hasPB) return 'Division 8'
    if (matchCount === 2 && hasPB) return 'Division 9'
    return null
  }
  // MegaDraw / Saturday Lotto defaults
  if (matchCount === 7) return 'Division 1'
  if (matchCount === 6 && hasSupp) return 'Division 2'
  if (matchCount === 6) return 'Division 3'
  if (matchCount === 5 && hasSupp) return 'Division 4'
  if (matchCount === 5) return 'Division 5'
  if (matchCount === 4) return 'Division 6'
  if (matchCount === 3 && hasSupp) return 'Division 7'
  return null
}

function getPrizeForDivision(draw: any, division: string): number {
  if (division === 'Division 1') return Number(draw.jackpotAmount)
  const prizes: Record<string, number> = {
    'Division 2': 50000,
    'Division 3': 4000,
    'Division 4': 200,
    'Division 5': 30,
    'Division 6': 20,
    'Division 7': 10,
    'Division 8': 7,
    'Division 9': 4,
  }
  return prizes[division] || 0
}
