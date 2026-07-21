"use strict";
/**
 * Jackpot Management Routes (Admin)
 * - View jackpot pools per game
 * - View jackpot history and transactions
 * - Configure base jackpot and contribution percentage
 * - Manual jackpot adjustments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = jackpotRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const jackpot_service_1 = require("../services/jackpot.service");
async function jackpotRoutes(app) {
    // GET /jackpot — All jackpot pools with game info
    app.get('/', async (_request, reply) => {
        const pools = await server_1.prisma.jackpotPool.findMany({
            include: {
                game: { select: { id: true, name: true, slug: true, imageUrl: true } },
            },
            orderBy: { currentJackpot: 'desc' },
        });
        return reply.send({ success: true, data: pools });
    });
    // GET /jackpot/:gameId — Single game jackpot pool with stats
    app.get('/:gameId', async (request, reply) => {
        const { gameId } = request.params;
        const game = await server_1.prisma.game.findUnique({
            where: { id: gameId },
            select: { id: true, name: true, slug: true, minJackpot: true },
        });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        // Ensure a pool exists
        await server_1.prisma.$transaction(async (tx) => {
            await (0, jackpot_service_1.ensureJackpotPool)(tx, gameId, game.minJackpot);
        });
        const pool = await server_1.prisma.jackpotPool.findUnique({
            where: { gameId },
            include: {
                game: { select: { id: true, name: true, slug: true } },
            },
        });
        return reply.send({ success: true, data: pool });
    });
    // GET /jackpot/:gameId/history — Paginated draw history
    app.get('/:gameId/history', async (request, reply) => {
        const { gameId } = request.params;
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [history, total] = await Promise.all([
            server_1.prisma.jackpotHistory.findMany({
                where: { gameId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            server_1.prisma.jackpotHistory.count({ where: { gameId } }),
        ]);
        return reply.send({
            success: true,
            data: history,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // GET /jackpot/:gameId/transactions — Paginated audit log
    app.get('/:gameId/transactions', async (request, reply) => {
        const { gameId } = request.params;
        const { page = '1', limit = '20', type } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { gameId };
        if (type)
            where.type = type;
        const [txns, total] = await Promise.all([
            server_1.prisma.jackpotTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            server_1.prisma.jackpotTransaction.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: txns,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // PATCH /jackpot/:gameId/config — Update base jackpot and contribution %
    const configSchema = zod_1.z.object({
        baseJackpot: zod_1.z.number().positive().optional(),
        jackpotContribPct: zod_1.z.number().min(1).max(100).optional(),
    });
    app.patch('/:gameId/config', async (request, reply) => {
        const { gameId } = request.params;
        const body = configSchema.parse(request.body);
        const game = await server_1.prisma.game.findUnique({ where: { id: gameId }, select: { minJackpot: true } });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        await server_1.prisma.$transaction(async (tx) => {
            await (0, jackpot_service_1.ensureJackpotPool)(tx, gameId, game.minJackpot);
        });
        const updateData = {};
        if (body.baseJackpot !== undefined)
            updateData.baseJackpot = body.baseJackpot;
        if (body.jackpotContribPct !== undefined)
            updateData.jackpotContribPct = body.jackpotContribPct;
        const pool = await server_1.prisma.jackpotPool.update({
            where: { gameId },
            data: updateData,
        });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'JACKPOT_CONFIG_UPDATED', 'JackpotPool', pool.id, undefined, body, request);
        return reply.send({ success: true, data: pool });
    });
    // POST /jackpot/:gameId/adjust — Manual jackpot adjustment
    const adjustSchema = zod_1.z.object({
        amount: zod_1.z.number().refine(v => v !== 0, { message: 'Amount cannot be zero' }),
        reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
    });
    app.post('/:gameId/adjust', async (request, reply) => {
        const { gameId } = request.params;
        const body = adjustSchema.parse(request.body);
        const game = await server_1.prisma.game.findUnique({ where: { id: gameId }, select: { id: true, minJackpot: true } });
        if (!game)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        await server_1.prisma.$transaction(async (tx) => {
            await (0, jackpot_service_1.ensureJackpotPool)(tx, gameId, game.minJackpot);
        });
        const pool = await server_1.prisma.jackpotPool.findUniqueOrThrow({ where: { gameId } });
        const before = Number(pool.currentJackpot);
        const after = Math.max(0, before + body.amount);
        await server_1.prisma.$transaction(async (tx) => {
            await tx.jackpotPool.update({
                where: { gameId },
                data: { currentJackpot: after },
            });
            // Update Game.jackpotAmount so public UI reflects the change
            await tx.game.update({
                where: { id: gameId },
                data: { jackpotAmount: after },
            });
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
                    metadata: { adminUserId: request.user?.userId },
                },
            });
        });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'JACKPOT_MANUAL_ADJUSTMENT', 'JackpotPool', pool.id, { currentJackpot: before }, { currentJackpot: after, reason: body.reason }, request);
        return reply.send({
            success: true,
            message: `Jackpot adjusted by 🪙${body.amount >= 0 ? '+' : ''}${body.amount.toFixed(2)}`,
            data: { before, after, reason: body.reason },
        });
    });
}
//# sourceMappingURL=jackpot.js.map