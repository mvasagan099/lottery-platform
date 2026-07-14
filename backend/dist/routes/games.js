"use strict";
/**
 * Lottery Games Routes
 * - Game listings, details, draws, prize divisions
 * - Ticket purchase flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = gameRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const purchaseSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    drawId: zod_1.z.string().optional(),
    lines: zod_1.z.array(zod_1.z.object({
        numbers: zod_1.z.array(zod_1.z.number().int().positive()),
        supplementary: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        powerball: zod_1.z.number().int().positive().optional(),
    })).min(1).max(50),
    isQuickPick: zod_1.z.boolean().default(false),
    draws: zod_1.z.number().int().min(1).max(25).default(1),
    isSyndicate: zod_1.z.boolean().default(false),
    syndicateId: zod_1.z.string().optional(),
});
async function gameRoutes(app) {
    // GET /games - List all active games
    app.get('/', async (request, reply) => {
        const cacheKey = 'games:all';
        const cached = await server_1.redis.get(cacheKey);
        if (cached) {
            return reply.send({ success: true, data: JSON.parse(cached) });
        }
        const games = await server_1.prisma.game.findMany({
            where: { isActive: true },
            orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            include: {
                prizeDivisions: { orderBy: { divisionOrder: 'asc' } },
                draws: {
                    where: { status: 'SCHEDULED' },
                    orderBy: { scheduledAt: 'asc' },
                    take: 1,
                    select: {
                        id: true,
                        drawNumber: true,
                        scheduledAt: true,
                        jackpotAmount: true,
                    },
                },
            },
        });
        const enriched = games.map((g) => ({
            ...g,
            nextDraw: g.draws[0] || null,
        }));
        await server_1.redis.setex(cacheKey, 60, JSON.stringify(enriched)); // 1min cache
        return reply.send({ success: true, data: enriched });
    });
    // GET /games/:slug - Single game details
    app.get('/:slug', async (request, reply) => {
        const { slug } = request.params;
        const game = await server_1.prisma.game.findUnique({
            where: { slug },
            include: {
                prizeDivisions: { orderBy: { divisionOrder: 'asc' } },
                draws: {
                    where: { status: { in: ['SCHEDULED', 'COMPLETED'] } },
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        drawNumber: true,
                        scheduledAt: true,
                        drawnAt: true,
                        jackpotAmount: true,
                        status: true,
                        winningNumbers: true,
                        supplementary: true,
                        powerball: true,
                    },
                },
            },
        });
        if (!game) {
            return reply.status(404).send({ success: false, error: 'Game not found' });
        }
        return reply.send({ success: true, data: game });
    });
    // GET /games/:slug/results - Draw history with winning numbers
    app.get('/:slug/results', async (request, reply) => {
        const { slug } = request.params;
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const game = await server_1.prisma.game.findUnique({ where: { slug }, select: { id: true } });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        const [draws, total] = await Promise.all([
            server_1.prisma.draw.findMany({
                where: { gameId: game.id, status: 'COMPLETED' },
                orderBy: { scheduledAt: 'desc' },
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    drawNumber: true,
                    drawnAt: true,
                    jackpotAmount: true,
                    winningNumbers: true,
                    supplementary: true,
                    powerball: true,
                    totalSales: true,
                    totalPrizes: true,
                    winningEntries: {
                        select: {
                            divisionName: true,
                            prizeAmount: true,
                        },
                    },
                },
            }),
            server_1.prisma.draw.count({ where: { gameId: game.id, status: 'COMPLETED' } }),
        ]);
        return reply.send({
            success: true,
            data: draws,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // GET /games/:slug/jackpot - Current jackpot
    app.get('/:slug/jackpot', async (request, reply) => {
        const { slug } = request.params;
        const game = await server_1.prisma.game.findUnique({
            where: { slug },
            select: { jackpotAmount: true, name: true },
        });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        const nextDraw = await server_1.prisma.draw.findFirst({
            where: { game: { slug }, status: 'SCHEDULED' },
            orderBy: { scheduledAt: 'asc' },
        });
        return reply.send({
            success: true,
            data: {
                jackpot: game.jackpotAmount,
                gameName: game.name,
                nextDraw,
            },
        });
    });
    // POST /games/purchase - Purchase lottery tickets
    app.post('/purchase', {
        preHandler: auth_1.authenticate,
        config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const body = purchaseSchema.parse(request.body);
        const userId = request.user.userId;
        // Get game and validate
        const game = await server_1.prisma.game.findUnique({
            where: { id: body.gameId, isActive: true },
        });
        if (!game) {
            return reply.status(404).send({ success: false, error: 'Game not found or unavailable' });
        }
        // Validate numbers for each line
        for (const line of body.lines) {
            if (line.numbers.length !== game.minNumbers) {
                return reply.status(400).send({
                    success: false,
                    error: `Each line must have exactly ${game.minNumbers} numbers`,
                });
            }
            const uniqueNums = new Set(line.numbers);
            if (uniqueNums.size !== line.numbers.length) {
                return reply.status(400).send({ success: false, error: 'Duplicate numbers not allowed' });
            }
            if (line.numbers.some((n) => n < 1 || n > game.numberPool)) {
                return reply.status(400).send({
                    success: false,
                    error: `Numbers must be between 1 and ${game.numberPool}`,
                });
            }
            if (game.hasPowerball && !line.powerball) {
                return reply.status(400).send({ success: false, error: 'Powerball number required' });
            }
        }
        // Get next scheduled draw
        const draw = body.drawId
            ? await server_1.prisma.draw.findUnique({ where: { id: body.drawId } })
            : await server_1.prisma.draw.findFirst({
                where: { gameId: game.id, status: 'SCHEDULED' },
                orderBy: { scheduledAt: 'asc' },
            });
        if (!draw) {
            return reply.status(400).send({ success: false, error: 'No upcoming draw available' });
        }
        const totalCost = Number(game.ticketPrice) * body.lines.length * body.draws;
        // Check wallet balance
        const wallet = await server_1.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true, bonusBalance: true },
        });
        if (!wallet || Number(wallet.balance) + Number(wallet.bonusBalance) < totalCost) {
            return reply.status(400).send({
                success: false,
                error: 'Insufficient funds. Please deposit to continue.',
                code: 'INSUFFICIENT_FUNDS',
            });
        }
        // Generate unique ticket number
        const ticketNumber = generateTicketNumber();
        const qrData = `MegaDraw:${ticketNumber}:${game.slug}:${draw.drawNumber}`;
        // Create ticket in transaction
        const ticket = await server_1.prisma.$transaction(async (tx) => {
            // Deduct from wallet (use bonus first)
            const bonusUsed = Math.min(Number(wallet.bonusBalance), totalCost);
            const mainUsed = totalCost - bonusUsed;
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: mainUsed },
                    bonusBalance: { decrement: bonusUsed },
                    totalSpent: { increment: totalCost },
                },
            });
            // Create ticket
            const newTicket = await tx.ticket.create({
                data: {
                    userId,
                    gameId: game.id,
                    drawId: draw.id,
                    ticketNumber,
                    qrCode: qrData,
                    isQuickPick: body.isQuickPick,
                    isSyndicate: body.isSyndicate,
                    syndicateId: body.syndicateId,
                    draws: body.draws,
                    totalCost,
                    numbers: {
                        create: body.lines.map((line, idx) => ({
                            lineIndex: idx,
                            numbers: line.numbers,
                            supplementary: line.supplementary,
                            powerball: line.powerball,
                        })),
                    },
                },
                include: { numbers: true },
            });
            // Log transaction
            await tx.transaction.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    type: 'TICKET_PURCHASE',
                    status: 'COMPLETED',
                    amount: -totalCost,
                    balanceBefore: Number(wallet.balance),
                    balanceAfter: Number(wallet.balance) - mainUsed,
                    reference: `TKT-${ticketNumber}`,
                    description: `${game.name} ticket - Draw #${draw.drawNumber}`,
                    ticketId: newTicket.id,
                    drawId: draw.id,
                },
            });
            // Update draw sales
            await tx.draw.update({
                where: { id: draw.id },
                data: { totalSales: { increment: totalCost } },
            });
            return newTicket;
        });
        // Send confirmation notification
        await server_1.prisma.notification.create({
            data: {
                userId,
                title: 'Ticket purchased',
                message: `Your ${game.name} ticket #${ticketNumber} for Draw #${draw.drawNumber} has been purchased.`,
                data: { ticketId: ticket.id, gameSlug: game.slug },
            },
        });
        return reply.status(201).send({
            success: true,
            message: 'Ticket purchased successfully',
            data: {
                ticket: {
                    id: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    gameName: game.name,
                    drawNumber: draw.drawNumber,
                    drawDate: draw.scheduledAt,
                    totalCost,
                    lines: ticket.numbers,
                    qrCode: ticket.qrCode,
                },
            },
        });
    });
    // POST /games/quick-pick - Generate quick pick numbers
    app.post('/quick-pick', async (request, reply) => {
        const { gameId, lines = 1 } = request.body;
        const game = await server_1.prisma.game.findUnique({
            where: { id: gameId },
            select: { numberPool: true, minNumbers: true, hasPowerball: true, powerballPool: true },
        });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        const picks = Array.from({ length: Math.min(lines, 20) }, () => {
            const nums = shuffleArray(Array.from({ length: game.numberPool }, (_, i) => i + 1)).slice(0, game.minNumbers).sort((a, b) => a - b);
            const result = { numbers: nums };
            if (game.hasPowerball && game.powerballPool) {
                result.powerball = Math.ceil(Math.random() * game.powerballPool);
            }
            return result;
        });
        return reply.send({ success: true, data: picks });
    });
}
function generateTicketNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
//# sourceMappingURL=games.js.map