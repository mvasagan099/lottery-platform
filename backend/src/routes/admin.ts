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
    const { page = '1', limit = '20', search, status, role, kycStatus, sortField = 'createdAt', sortDir = 'desc' } = request.query as Record<string, string>
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
    if (kycStatus) where.kycStatus = kycStatus

    const orderBy: any = {}
    orderBy[sortField] = sortDir

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
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
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        sessions: {
          where: { isActive: true },
          select: { id: true, ipAddress: true, lastUsedAt: true, userAgent: true },
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

    await auditLog(request.user.userId, 'USER_STATUS_CHANGED', 'User', id, { oldStatus: oldUser?.status }, { newStatus: status, reason }, request)

    return reply.send({ success: true, message: `User status changed to ${status}` })
  })

  // POST /users/bulk-action - Bulk suspend/activate/delete
  app.post('/users/bulk-action', async (request, reply) => {
    const { userIds, action } = request.body as { userIds: string[]; action: 'SUSPEND' | 'ACTIVATE' | 'DELETE' }
    
    if (!userIds || userIds.length === 0) return reply.status(400).send({ success: false, error: 'No users selected' })

    if (action === 'DELETE') {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    } else {
      const status = action === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED'
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status }
      })
    }

    await auditLog(request.user.userId, `BULK_${action}`, 'User', 'Multiple', undefined, { count: userIds.length }, request)

    return reply.send({ success: true, message: `Successfully applied ${action} to ${userIds.length} users` })
  })

  // POST /users/:id/wallet/adjust - Manual wallet adjustment
  app.post('/users/:id/wallet/adjust', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { amount, reason, type } = request.body as { amount: number; reason: string; type: 'CREDIT' | 'DEBIT' }

    if (amount <= 0) return reply.status(400).send({ success: false, error: 'Amount must be positive' })

    const user = await prisma.user.findUnique({ where: { id }, include: { wallet: true } })
    if (!user || !user.wallet) return reply.status(404).send({ success: false, error: 'User or wallet not found' })

    if (type === 'DEBIT' && user.wallet.balance.toNumber() < amount) {
      return reply.status(400).send({ success: false, error: 'Insufficient balance for debit' })
    }

    const newBalance = type === 'CREDIT' ? user.wallet.balance.toNumber() + amount : user.wallet.balance.toNumber() - amount

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: newBalance }
      })

      await tx.transaction.create({
        data: {
          userId: id,
          walletId: user.wallet!.id,
          type: type === 'CREDIT' ? 'BONUS_CREDIT' : 'WITHDRAWAL',
          amount: amount,
          balanceBefore: user.wallet!.balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          reference: `Admin Adjustment: ${reason}`
        }
      })
    })

    await auditLog(request.user.userId, 'WALLET_ADJUSTED', 'Wallet', user.wallet.id, undefined, { type, amount, reason }, request)

    return reply.send({ success: true, message: `Successfully ${type.toLowerCase()}ed $${amount}`, newBalance })
  })

  // ── KYC Management ────────────────────────────────────────────────────────

  app.get('/kyc', async (request, reply) => {
    const { page = '1', limit = '10', search, status, documentType, sortField = 'submittedAt', sortDir = 'desc' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (status) where.status = status
    if (documentType) where.documentType = documentType

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [records, total, totalRequests, pendingReview, approvedToday, rejectedToday] = await Promise.all([
      prisma.kYCRecord.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortField]: sortDir },
        include: {
          user: { select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true } },
        },
      }),
      prisma.kYCRecord.count({ where }),
      prisma.kYCRecord.count(),
      prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
      prisma.kYCRecord.count({ where: { status: 'APPROVED', reviewedAt: { gte: today } } }),
      prisma.kYCRecord.count({ where: { status: 'REJECTED', reviewedAt: { gte: today } } }),
    ])

    const stats = { totalRequests, pendingReview, approvedToday, rejectedToday }
    return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats })
  })

  app.get('/kyc/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const record = await prisma.kYCRecord.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true,
            sessions: { where: { isActive: true } },
            kycRecords: { orderBy: { submittedAt: 'desc' } }
          }
        }
      }
    })
    if (!record) return reply.status(404).send({ success: false, error: 'KYC Record not found' })
    return reply.send({ success: true, data: record })
  })

  app.patch('/kyc/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = request.body as { status: 'APPROVED' | 'REJECTED'; notes?: string }

    const record = await prisma.kYCRecord.update({
      where: { id },
      data: { status, reviewedById: request.user.userId, reviewNotes: notes, reviewedAt: new Date() },
    })

    await prisma.user.update({ where: { id: record.userId }, data: { kycStatus: status } })
    await prisma.notification.create({
      data: {
        userId: record.userId,
        title: `Identity verification ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
        message: status === 'APPROVED' ? 'Your identity has been verified.' : `Verification rejected: ${notes || 'Please resubmit.'}`,
      },
    })
    await auditLog(request.user.userId, `KYC_${status}`, 'KYCRecord', id, undefined, { status, notes }, request)
    return reply.send({ success: true, message: `KYC ${status.toLowerCase()}` })
  })

  app.post('/kyc/bulk-action', async (request, reply) => {
    const { recordIds, action, notes } = request.body as { recordIds: string[]; action: 'APPROVED' | 'REJECTED', notes?: string }
    if (!recordIds || recordIds.length === 0) return reply.status(400).send({ success: false, error: 'No records provided' })

    const records = await prisma.kYCRecord.findMany({ where: { id: { in: recordIds } } })
    
    await prisma.kYCRecord.updateMany({
      where: { id: { in: recordIds } },
      data: { status: action, reviewedById: request.user.userId, reviewNotes: notes, reviewedAt: new Date() }
    })

    for (const record of records) {
      await prisma.user.update({ where: { id: record.userId }, data: { kycStatus: action } })
      await prisma.notification.create({
        data: {
          userId: record.userId,
          title: `Identity verification ${action === 'APPROVED' ? 'approved' : 'rejected'}`,
          message: action === 'APPROVED' ? 'Your identity has been verified.' : `Verification rejected: ${notes || 'Please resubmit.'}`,
        },
      })
    }
    
    await auditLog(request.user.userId, `BULK_KYC_${action}`, 'KYCRecord', 'BULK', undefined, { count: recordIds.length }, request)
    return reply.send({ success: true, message: `Successfully ${action.toLowerCase()} ${recordIds.length} records` })
  })

  // ── Affiliate Management ───────────────────────────────────────────────────

  app.get('/affiliates', async (request, reply) => {
    const { page = '1', limit = '10', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (status) where.isActive = status === 'ACTIVE'

    if (search) {
      where.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [records, total, totalAffiliates, activeAffiliates, totalEarned, totalPending] = await Promise.all([
      prisma.affiliateAccount.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortField]: sortDir },
        include: {
          user: { select: { id: true, email: true, username: true, country: true } },
          _count: { select: { commissions: true } }
        },
      }),
      prisma.affiliateAccount.count({ where }),
      prisma.affiliateAccount.count(),
      prisma.affiliateAccount.count({ where: { isActive: true } }),
      prisma.affiliateAccount.aggregate({ _sum: { totalEarned: true } }),
      prisma.affiliateAccount.aggregate({ _sum: { pendingAmount: true } }),
    ])

    const stats = { 
      totalAffiliates, 
      activeAffiliates, 
      totalEarned: totalEarned._sum.totalEarned || 0, 
      totalPending: totalPending._sum.pendingAmount || 0 
    }
    return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats })
  })

  app.get('/affiliates/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const record = await prisma.affiliateAccount.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, country: true, createdAt: true } },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })
    if (!record) return reply.status(404).send({ success: false, error: 'Affiliate not found' })
    return reply.send({ success: true, data: record })
  })

  app.patch('/affiliates/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isActive, commissionRate } = request.body as { isActive?: boolean; commissionRate?: number }

    const dataToUpdate: any = {}
    if (isActive !== undefined) dataToUpdate.isActive = isActive
    if (commissionRate !== undefined) dataToUpdate.commissionRate = commissionRate

    await prisma.affiliateAccount.update({ where: { id }, data: dataToUpdate })
    await auditLog(request.user.userId, 'AFFILIATE_UPDATED', 'AffiliateAccount', id, undefined, dataToUpdate, request)
    return reply.send({ success: true, message: 'Affiliate updated successfully' })
  })

  app.post('/affiliates/bulk-action', async (request, reply) => {
    const { recordIds, action } = request.body as { recordIds: string[]; action: 'SUSPEND' | 'ACTIVATE' }
    if (!recordIds || recordIds.length === 0) return reply.status(400).send({ success: false, error: 'No records provided' })

    const isActive = action === 'ACTIVATE'
    await prisma.affiliateAccount.updateMany({
      where: { id: { in: recordIds } },
      data: { isActive }
    })

    await auditLog(request.user.userId, `BULK_AFFILIATE_${action}`, 'AffiliateAccount', 'BULK', undefined, { count: recordIds.length }, request)
    return reply.send({ success: true, message: `Successfully ${action.toLowerCase()}d ${recordIds.length} affiliates` })
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

  // ── Game Management ────────────────────────────────────────────────────────

  app.get('/games', async (request, reply) => {
    const { page = '1', limit = '10', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (status) where.isActive = status === 'ACTIVE'

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [records, total, totalGames, activeGames, totalJackpots] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortField]: sortDir },
        include: {
          _count: { select: { draws: true, tickets: true } }
        },
      }),
      prisma.game.count({ where }),
      prisma.game.count(),
      prisma.game.count({ where: { isActive: true } }),
      prisma.game.aggregate({ _sum: { jackpotAmount: true } }),
    ])

    const stats = { 
      totalGames, 
      activeGames, 
      disabledGames: totalGames - activeGames,
      totalJackpots: totalJackpots._sum.jackpotAmount || 0 
    }
    return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats })
  })

  app.get('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const record = await prisma.game.findUnique({
      where: { id },
      include: {
        prizeDivisions: { orderBy: { divisionOrder: 'asc' } },
        draws: {
          orderBy: { scheduledAt: 'desc' },
          take: 5
        }
      }
    })
    if (!record) return reply.status(404).send({ success: false, error: 'Game not found' })
    return reply.send({ success: true, data: record })
  })

  app.patch('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isActive, jackpotAmount, ticketPrice } = request.body as { isActive?: boolean; jackpotAmount?: number; ticketPrice?: number }

    const dataToUpdate: any = {}
    if (isActive !== undefined) dataToUpdate.isActive = isActive
    if (jackpotAmount !== undefined) dataToUpdate.jackpotAmount = jackpotAmount
    if (ticketPrice !== undefined) dataToUpdate.ticketPrice = ticketPrice

    await prisma.game.update({ where: { id }, data: dataToUpdate })
    await auditLog(request.user.userId, 'GAME_UPDATED', 'Game', id, undefined, dataToUpdate, request)
    return reply.send({ success: true, message: 'Game updated successfully' })
  })

  app.post('/games/bulk-action', async (request, reply) => {
    const { recordIds, action } = request.body as { recordIds: string[]; action: 'DISABLE' | 'ENABLE' }
    if (!recordIds || recordIds.length === 0) return reply.status(400).send({ success: false, error: 'No records provided' })

    const isActive = action === 'ENABLE'
    await prisma.game.updateMany({
      where: { id: { in: recordIds } },
      data: { isActive }
    })

    await auditLog(request.user.userId, `BULK_GAME_${action}`, 'Game', 'BULK', undefined, { count: recordIds.length }, request)
    return reply.send({ success: true, message: `Successfully ${action.toLowerCase()}d ${recordIds.length} games` })
  })

  // ── Stats ───────────────────────────────────────────────────────────────

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
