/**
 * Jackpot Management Routes (Admin)
 * - View jackpot pools per game
 * - View jackpot history and transactions
 * - Configure base jackpot and contribution percentage
 * - Manual jackpot adjustments
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { auditLog } from '../middleware/auth'
import { ensureJackpotPool } from '../services/jackpot.service'

export default async function jackpotRoutes(app: FastifyInstance) {

  // GET /jackpot — All jackpot pools with game info
  app.get('/', async (_request, reply) => {
    const pools = await prisma.jackpotPool.findMany({
      include: {
        game: { select: { id: true, name: true, slug: true, imageUrl: true } },
      },
      orderBy: { currentJackpot: 'desc' },
    })
    return reply.send({ success: true, data: pools })
  })

  // GET /jackpot/:gameId — Single game jackpot pool with stats
  app.get('/:gameId', async (request, reply) => {
    const { gameId } = request.params as { gameId: string }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, name: true, slug: true, minJackpot: true },
    })
    if (!game) return reply.status(404).send({ success: false, error: 'Game not found' })

    // Ensure a pool exists
    await prisma.$transaction(async (tx) => {
      await ensureJackpotPool(tx, gameId, game.minJackpot)
    })

    const pool = await prisma.jackpotPool.findUnique({
      where: { gameId },
      include: {
        game: { select: { id: true, name: true, slug: true } },
      },
    })

    return reply.send({ success: true, data: pool })
  })

  // GET /jackpot/:gameId/history — Paginated draw history
  app.get('/:gameId/history', async (request, reply) => {
    const { gameId } = request.params as { gameId: string }
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const [history, total] = await Promise.all([
      prisma.jackpotHistory.findMany({
        where: { gameId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.jackpotHistory.count({ where: { gameId } }),
    ])

    return reply.send({
      success: true,
      data: history,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // GET /jackpot/:gameId/transactions — Paginated audit log
  app.get('/:gameId/transactions', async (request, reply) => {
    const { gameId } = request.params as { gameId: string }
    const { page = '1', limit = '20', type } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { gameId }
    if (type) where.type = type

    const [txns, total] = await Promise.all([
      prisma.jackpotTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.jackpotTransaction.count({ where }),
    ])

    return reply.send({
      success: true,
      data: txns,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  })

  // PATCH /jackpot/:gameId/config — Update base jackpot and contribution %
  const configSchema = z.object({
    baseJackpot: z.number().positive().optional(),
    jackpotContribPct: z.number().min(1).max(100).optional(),
  })

  app.patch('/:gameId/config', async (request, reply) => {
    const { gameId } = request.params as { gameId: string }
    const body = configSchema.parse(request.body)

    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { minJackpot: true } })
    if (!game) return reply.status(404).send({ success: false, error: 'Game not found' })

    await prisma.$transaction(async (tx) => {
      await ensureJackpotPool(tx, gameId, game.minJackpot)
    })

    const updateData: any = {}
    if (body.baseJackpot !== undefined) updateData.baseJackpot = body.baseJackpot
    if (body.jackpotContribPct !== undefined) updateData.jackpotContribPct = body.jackpotContribPct

    const pool = await prisma.jackpotPool.update({
      where: { gameId },
      data: updateData,
    })

    await auditLog(
      (request as any).user?.userId || 'system',
      'JACKPOT_CONFIG_UPDATED',
      'JackpotPool',
      pool.id,
      undefined,
      body,
      request
    )

    return reply.send({ success: true, data: pool })
  })

  // POST /jackpot/:gameId/adjust — Manual jackpot adjustment
  const adjustSchema = z.object({
    amount: z.number().refine(v => v !== 0, { message: 'Amount cannot be zero' }),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
  })

  app.post('/:gameId/adjust', async (request, reply) => {
    const { gameId } = request.params as { gameId: string }
    const body = adjustSchema.parse(request.body)

    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true, minJackpot: true } })
    if (!game) return reply.status(404).send({ success: false, error: 'Game not found' })

    await prisma.$transaction(async (tx) => {
      await ensureJackpotPool(tx, gameId, game.minJackpot)
    })

    const pool = await prisma.jackpotPool.findUniqueOrThrow({ where: { gameId } })
    const before = Number(pool.currentJackpot)
    const after = Math.max(0, before + body.amount)

    await prisma.$transaction(async (tx) => {
      await tx.jackpotPool.update({
        where: { gameId },
        data: { currentJackpot: after },
      })

      // Update Game.jackpotAmount so public UI reflects the change
      await tx.game.update({
        where: { id: gameId },
        data: { jackpotAmount: after },
      })

      // Audit log entry
      await tx.jackpotTransaction.create({
        data: {
          jackpotPoolId: pool.id,
          gameId,
          type: 'MANUAL_ADJUSTMENT',
          amount: body.amount,
          balanceBefore: before,
          balanceAfter: after,
          description: body.reason,
          metadata: { adminUserId: (request as any).user?.userId },
        },
      })
    })

    await auditLog(
      (request as any).user?.userId || 'system',
      'JACKPOT_MANUAL_ADJUSTMENT',
      'JackpotPool',
      pool.id,
      { currentJackpot: before },
      { currentJackpot: after, reason: body.reason },
      request
    )

    return reply.send({
      success: true,
      message: `Jackpot adjusted by 🪙${body.amount >= 0 ? '+' : ''}${body.amount.toFixed(2)}`,
      data: { before, after, reason: body.reason },
    })
  })
}
