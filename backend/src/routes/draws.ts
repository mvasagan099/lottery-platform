/**
 * Draw Management Routes
 * - Schedule, run, publish draws
 * - Prize calculation engine
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate, requireAdmin, auditLog } from '../middleware/auth'

const createDrawSchema = z.object({
  gameId: z.string(),
  drawNumber: z.number().int().positive(),
  scheduledAt: z.string().datetime(),
  jackpotAmount: z.number().positive(),
})

const runDrawSchema = z.object({
  winningNumbers: z.array(z.number().int().positive()),
  supplementary: z.array(z.number().int().positive()).optional(),
  powerball: z.number().int().positive().optional(),
})

export default async function drawRoutes(app: FastifyInstance) {

  // GET /draws - Upcoming and recent draws (public)
  app.get('/', async (request, reply) => {
    const { gameId, status, page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (gameId) where.gameId = gameId
    if (status) where.status = status
    else where.status = { in: ['SCHEDULED', 'COMPLETED'] }

    const [draws, total] = await Promise.all([
      prisma.draw.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { scheduledAt: 'desc' },
        include: {
          game: { select: { name: true, slug: true, imageUrl: true } },
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

  // GET /draws/:id - Single draw details
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        game: {
          include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } },
        },
        winningEntries: {
          select: { divisionName: true, prizeAmount: true, _count: true },
        },
      },
    })

    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })

    return reply.send({ success: true, data: draw })
  })

  // GET /draws/next/:gameSlug - Next upcoming draw for a game
  app.get('/next/:gameSlug', async (request, reply) => {
    const { gameSlug } = request.params as { gameSlug: string }

    const draw = await prisma.draw.findFirst({
      where: { game: { slug: gameSlug }, status: 'SCHEDULED' },
      orderBy: { scheduledAt: 'asc' },
      include: { game: { select: { name: true, ticketPrice: true } } },
    })

    return reply.send({ success: true, data: draw })
  })

  // ── Admin Draw Management ─────────────────────────────────────────────────

  // POST /draws - Create a new draw (admin only)
  app.post('/', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const body = createDrawSchema.parse(request.body)

    // Check game exists
    const game = await prisma.game.findUnique({ where: { id: body.gameId } })
    if (!game) return reply.status(404).send({ success: false, error: 'Game not found' })

    // Check for duplicate draw number
    const existing = await prisma.draw.findFirst({
      where: { gameId: body.gameId, drawNumber: body.drawNumber },
    })
    if (existing) {
      return reply.status(409).send({ success: false, error: 'Draw number already exists for this game' })
    }

    const draw = await prisma.draw.create({
      data: {
        gameId: body.gameId,
        drawNumber: body.drawNumber,
        scheduledAt: new Date(body.scheduledAt),
        jackpotAmount: body.jackpotAmount,
      },
    })

    await auditLog(request.user.userId, 'DRAW_CREATED', 'Draw', draw.id, undefined, body, request)

    return reply.status(201).send({ success: true, data: draw })
  })

  // POST /draws/:id/run - Execute a draw (generate winning numbers)
  app.post('/:id/run', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = runDrawSchema.parse(request.body)

    const draw = await prisma.draw.findUnique({
      where: { id },
      include: { game: true },
    })

    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })
    if (draw.status !== 'SCHEDULED') {
      return reply.status(400).send({ success: false, error: `Draw is already ${draw.status}` })
    }

    // Validate winning numbers
    const game = draw.game
    if (body.winningNumbers.length !== game.minNumbers) {
      return reply.status(400).send({
        success: false,
        error: `Must provide exactly ${game.minNumbers} winning numbers`,
      })
    }

    const uniqueNums = new Set(body.winningNumbers)
    if (uniqueNums.size !== body.winningNumbers.length) {
      return reply.status(400).send({ success: false, error: 'Winning numbers must be unique' })
    }

    if (body.winningNumbers.some((n) => n < 1 || n > game.numberPool)) {
      return reply.status(400).send({
        success: false,
        error: `Numbers must be between 1 and ${game.numberPool}`,
      })
    }

    if (game.hasPowerball && !body.powerball) {
      return reply.status(400).send({ success: false, error: 'Powerball number required' })
    }

    // Update draw to in-progress
    await prisma.draw.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        winningNumbers: body.winningNumbers,
        supplementary: body.supplementary || null,
        powerball: body.powerball || null,
        drawnAt: new Date(),
      },
    })

    await auditLog(
      request.user.userId,
      'DRAW_EXECUTED',
      'Draw',
      id,
      undefined,
      { winningNumbers: body.winningNumbers, powerball: body.powerball },
      request
    )

    return reply.send({
      success: true,
      message: 'Draw executed. Run prize calculation to process winners.',
      data: { drawId: id },
    })
  })

  // POST /draws/:id/calculate-prizes - Calculate and award prizes
  app.post('/:id/calculate-prizes', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        game: {
          include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } },
        },
        tickets: {
          include: { numbers: true },
        },
      },
    })

    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })
    if (draw.status !== 'IN_PROGRESS') {
      return reply.status(400).send({ success: false, error: 'Draw must be in progress to calculate prizes' })
    }

    const winningNums = draw.winningNumbers as number[]
    const suppNums = draw.supplementary as number[] | null
    const pb = draw.powerball

    let totalPrizes = 0
    const winnersSummary: Record<string, number> = {}

    // Process each ticket
    for (const ticket of draw.tickets) {
      if (ticket.status === 'CANCELLED') continue

      let bestDivision: any = null
      let bestPrize = 0

      for (const line of ticket.numbers) {
        const nums = line.numbers as number[]
        const matched = nums.filter((n) => winningNums.includes(n)).length
        const matchedSupp = suppNums
          ? nums.filter((n) => suppNums.includes(n)).length
          : 0
        const pbMatched = pb && line.powerball === pb

        // Find best matching prize division
        for (const div of draw.game.prizeDivisions) {
          const numMatch = div.matchNumbers === matched
          const suppMatch = div.matchSupp === 0 || matchedSupp >= div.matchSupp
          const pbMatch = !div.matchPB || pbMatched

          if (numMatch && suppMatch && pbMatch) {
            const prizeAmt = Number(div.fixedPrize || draw.jackpotAmount)
            if (prizeAmt > bestPrize) {
              bestPrize = prizeAmt
              bestDivision = div
            }
            break
          }
        }
      }

      if (bestDivision && bestPrize > 0) {
        // Create winning entry
        await prisma.winningEntry.create({
          data: {
            ticketId: ticket.id,
            drawId: id,
            divisionName: bestDivision.divisionName,
            prizeAmount: bestPrize,
          },
        })

        // Update ticket
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'WON',
            prizeAmount: bestPrize,
            prizeDivision: bestDivision.divisionName,
          },
        })

        // Notify winner
        await prisma.notification.create({
          data: {
            userId: ticket.userId,
            title: '🏆 You\'ve won a prize!',
            message: `Congratulations! You won ${bestDivision.divisionName} ($${bestPrize.toFixed(2)}) in Draw #${draw.drawNumber}!`,
            data: { ticketId: ticket.id, drawId: id },
          },
        })

        totalPrizes += bestPrize
        winnersSummary[bestDivision.divisionName] = (winnersSummary[bestDivision.divisionName] || 0) + 1
      } else {
        // Mark non-winning tickets
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'LOST' },
        })
      }
    }

    // Update draw status
    await prisma.draw.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        totalPrizes,
        isVerified: false,
      },
    })

    await auditLog(
      request.user.userId,
      'PRIZES_CALCULATED',
      'Draw',
      id,
      undefined,
      { totalPrizes, winnersSummary },
      request
    )

    return reply.send({
      success: true,
      message: 'Prize calculation complete',
      data: { totalPrizes, winnersSummary },
    })
  })

  // POST /draws/:id/publish - Publish draw results
  app.post('/:id/publish', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const draw = await prisma.draw.findUnique({ where: { id } })
    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })
    if (draw.status !== 'COMPLETED') {
      return reply.status(400).send({ success: false, error: 'Draw must be completed before publishing' })
    }

    await prisma.draw.update({
      where: { id },
      data: {
        publishedAt: new Date(),
        isVerified: true,
        verifiedById: request.user.userId,
      },
    })

    await auditLog(request.user.userId, 'DRAW_PUBLISHED', 'Draw', id, undefined, undefined, request)

    return reply.send({ success: true, message: 'Draw results published' })
  })

  // PUT /draws/:id - Update draw (admin)
  app.put('/:id', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { scheduledAt, jackpotAmount, notes } = request.body as any

    const draw = await prisma.draw.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(jackpotAmount && { jackpotAmount }),
        ...(notes && { notes }),
      },
    })

    return reply.send({ success: true, data: draw })
  })

  // DELETE /draws/:id - Cancel draw (admin)
  app.delete('/:id', {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const draw = await prisma.draw.findUnique({ where: { id } })
    if (!draw) return reply.status(404).send({ success: false, error: 'Draw not found' })
    if (draw.status !== 'SCHEDULED') {
      return reply.status(400).send({ success: false, error: 'Only scheduled draws can be cancelled' })
    }

    await prisma.draw.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    await auditLog(request.user.userId, 'DRAW_CANCELLED', 'Draw', id, undefined, undefined, request)

    return reply.send({ success: true, message: 'Draw cancelled' })
  })
}
