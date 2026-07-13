/**
 * Reports Routes
 * - Revenue, sales, user statistics
 * - CSV export
 */

import { FastifyInstance } from 'fastify'
import { prisma } from '../server'
import { authenticate, requireAdmin } from '../middleware/auth'

export default async function reportRoutes(app: FastifyInstance) {

  // All report routes require admin
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireAdmin)

  // GET /reports/revenue - Revenue report
  app.get('/revenue', async (request, reply) => {
    const { from, to, groupBy = 'day' } = request.query as Record<string, string>

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    const [deposits, withdrawals, prizes] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PRIZE_CREDIT',
          status: 'COMPLETED',
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const ticketSales = await prisma.transaction.aggregate({
      where: {
        type: 'TICKET_PURCHASE',
        status: 'COMPLETED',
        createdAt: { gte: fromDate, lte: toDate },
      },
      _sum: { amount: true },
      _count: true,
    })

    const totalDeposits = Number(deposits._sum.amount || 0)
    const totalWithdrawals = Number(withdrawals._sum.amount || 0)
    const totalPrizes = Number(prizes._sum.amount || 0)
    const totalTicketRevenue = Math.abs(Number(ticketSales._sum.amount || 0))

    return reply.send({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        totalDeposits,
        depositCount: deposits._count,
        totalWithdrawals,
        withdrawalCount: withdrawals._count,
        totalPrizesPaid: totalPrizes,
        totalTicketRevenue,
        grossRevenue: totalDeposits,
        netRevenue: totalDeposits - totalWithdrawals - totalPrizes,
        grossProfit: totalTicketRevenue - totalPrizes,
      },
    })
  })

  // GET /reports/tickets - Ticket sales report
  app.get('/tickets', async (request, reply) => {
    const { from, to, gameId } = request.query as Record<string, string>

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    const where: any = {
      purchasedAt: { gte: fromDate, lte: toDate },
    }
    if (gameId) where.gameId = gameId

    const [totalTickets, byGame, byStatus] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['gameId'],
        where,
        _count: true,
        _sum: { totalCost: true },
      }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ])

    // Enrich with game names
    const gameIds = byGame.map((g) => g.gameId)
    const games = await prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, name: true, slug: true },
    })
    const gameMap = Object.fromEntries(games.map((g) => [g.id, g]))

    const enrichedByGame = byGame.map((g) => ({
      ...g,
      game: gameMap[g.gameId],
    }))

    return reply.send({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        totalTickets,
        byGame: enrichedByGame,
        byStatus,
      },
    })
  })

  // GET /reports/users - User registration report
  app.get('/users', async (request, reply) => {
    const { from, to } = request.query as Record<string, string>

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    const [total, newUsers, byStatus, byKyc] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['kycStatus'],
        _count: true,
      }),
    ])

    return reply.send({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        totalUsers: total,
        newRegistrations: newUsers,
        byStatus,
        byKycStatus: byKyc,
      },
    })
  })

  // GET /reports/draws - Draw history report
  app.get('/draws', async (request, reply) => {
    const { gameId, page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { status: 'COMPLETED' }
    if (gameId) where.gameId = gameId

    const [draws, total] = await Promise.all([
      prisma.draw.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { drawnAt: 'desc' },
        include: {
          game: { select: { name: true, slug: true } },
          _count: { select: { tickets: true, winningEntries: true } },
        },
      }),
      prisma.draw.count({ where }),
    ])

    return reply.send({
      success: true,
      data: draws,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // GET /reports/affiliates - Affiliate performance report
  app.get('/affiliates', async (request, reply) => {
    const affiliates = await prisma.affiliateAccount.findMany({
      orderBy: { totalEarned: 'desc' },
      take: 50,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    })

    const totals = await prisma.affiliateAccount.aggregate({
      _sum: { totalEarned: true, totalPaid: true, pendingAmount: true },
      _count: true,
    })

    return reply.send({
      success: true,
      data: {
        affiliates,
        totals: {
          count: totals._count,
          totalEarned: totals._sum.totalEarned,
          totalPaid: totals._sum.totalPaid,
          pendingAmount: totals._sum.pendingAmount,
        },
      },
    })
  })

  // GET /reports/summary - Dashboard summary (last 30 days)
  app.get('/summary', async (request, reply) => {
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      ticketsToday,
      ticketsWeek,
      revenueToday,
      revenueWeek,
      pendingWithdrawals,
      pendingKYC,
      activeDraws,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.ticket.count({ where: { purchasedAt: { gte: today } } }),
      prisma.ticket.count({ where: { purchasedAt: { gte: lastWeek } } }),
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: lastWeek } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
      prisma.draw.count({ where: { status: 'SCHEDULED' } }),
    ])

    return reply.send({
      success: true,
      data: {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        ticketsToday,
        ticketsWeek,
        revenueToday: Number(revenueToday._sum.amount || 0),
        revenueWeek: Number(revenueWeek._sum.amount || 0),
        pendingWithdrawals,
        pendingKYC,
        activeDraws,
      },
    })
  })

  // GET /reports/audit-logs - Audit log viewer
  app.get('/audit-logs', async (request, reply) => {
    const { page = '1', limit = '50', userId, action } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (userId) where.userId = userId
    if (action) where.action = { contains: action, mode: 'insensitive' }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return reply.send({
      success: true,
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })
}
