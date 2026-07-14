"use strict";
/**
 * Reports Routes
 * - Revenue, sales, user statistics
 * - CSV export
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reportRoutes;
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const dayjs_1 = __importDefault(require("dayjs"));
async function reportRoutes(app) {
    // All report routes require admin
    app.addHook('preHandler', auth_1.authenticate);
    app.addHook('preHandler', auth_1.requireAdmin);
    // GET /reports/overview - High level financial KPIs
    app.get('/overview', async (request, reply) => {
        const { from, to } = request.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        const dateFilter = { gte: fromDate, lte: toDate };
        const [deposits, withdrawals, ticketSales, prizes, bonuses, affiliateCommissions, pendingWithdrawals] = await Promise.all([
            server_1.prisma.transaction.aggregate({ where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: 'TICKET_PURCHASE', status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: 'PRIZE_CREDIT', status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: { in: ['BONUS_CREDIT', 'REFERRAL_BONUS'] }, status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: 'AFFILIATE_COMMISSION', status: 'COMPLETED', createdAt: dateFilter }, _sum: { amount: true }, _count: true }),
            server_1.prisma.transaction.aggregate({ where: { type: 'WITHDRAWAL', status: 'PENDING' }, _sum: { amount: true }, _count: true })
        ]);
        const totalDeposits = Number(deposits._sum.amount || 0);
        const totalWithdrawals = Math.abs(Number(withdrawals._sum.amount || 0));
        const totalTicketSales = Math.abs(Number(ticketSales._sum.amount || 0));
        const totalPrizes = Number(prizes._sum.amount || 0);
        const totalBonuses = Number(bonuses._sum.amount || 0);
        const totalAffiliate = Number(affiliateCommissions._sum.amount || 0);
        const grossProfit = totalTicketSales - totalPrizes;
        const netProfit = grossProfit - totalBonuses - totalAffiliate;
        return reply.send({
            success: true,
            data: {
                totalDeposits, depositCount: deposits._count,
                totalWithdrawals, withdrawalCount: withdrawals._count,
                totalTicketSales, ticketSalesCount: ticketSales._count,
                totalPrizes, totalBonuses, totalAffiliate,
                grossProfit, netProfit,
                pendingWithdrawals: { total: Math.abs(Number(pendingWithdrawals._sum.amount || 0)), count: pendingWithdrawals._count }
            }
        });
    });
    // GET /reports/charts - Time-series data for Recharts
    app.get('/charts', async (request, reply) => {
        const { from, to, interval = 'day' } = request.query;
        const fromDate = from ? (0, dayjs_1.default)(from).toDate() : (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const toDate = to ? (0, dayjs_1.default)(to).toDate() : (0, dayjs_1.default)().toDate();
        // For a simple approach, we fetch all relevant transactions in the period and bucket them in JS
        // (In a true massive DB, we'd use raw SQL date_trunc, but this is safer for SQLite/Postgres compatibility here)
        const txs = await server_1.prisma.transaction.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: fromDate, lte: toDate },
                type: { in: ['DEPOSIT', 'WITHDRAWAL', 'TICKET_PURCHASE', 'PRIZE_CREDIT'] }
            },
            select: { createdAt: true, amount: true, type: true }
        });
        const chartDataMap = {};
        // Initialize buckets
        let curr = (0, dayjs_1.default)(fromDate);
        const end = (0, dayjs_1.default)(toDate);
        while (curr.isBefore(end) || curr.isSame(end, interval)) {
            const key = curr.format(interval === 'month' ? 'MMM YYYY' : 'MMM DD');
            chartDataMap[key] = { name: key, revenue: 0, deposits: 0, withdrawals: 0, tickets: 0 };
            curr = curr.add(1, interval);
        }
        // Fill buckets
        for (const tx of txs) {
            const key = (0, dayjs_1.default)(tx.createdAt).format(interval === 'month' ? 'MMM YYYY' : 'MMM DD');
            if (!chartDataMap[key])
                continue;
            const amount = Number(tx.amount);
            if (tx.type === 'DEPOSIT')
                chartDataMap[key].deposits += amount;
            else if (tx.type === 'WITHDRAWAL')
                chartDataMap[key].withdrawals += Math.abs(amount);
            else if (tx.type === 'TICKET_PURCHASE') {
                const absAmount = Math.abs(amount);
                chartDataMap[key].tickets += absAmount;
                chartDataMap[key].revenue += absAmount;
            }
            else if (tx.type === 'PRIZE_CREDIT') {
                chartDataMap[key].revenue -= amount; // prizes reduce net revenue
            }
        }
        return reply.send({
            success: true,
            data: Object.values(chartDataMap)
        });
    });
    // GET /reports/live - Live recent transactions for dashboard feed
    app.get('/live', async (request, reply) => {
        const transactions = await server_1.prisma.transaction.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true, email: true } } }
        });
        return reply.send({ success: true, data: transactions });
    });
    // GET /reports/revenue - Revenue report
    app.get('/revenue', async (request, reply) => {
        const { from, to, groupBy = 'day' } = request.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        const [deposits, withdrawals, prizes] = await Promise.all([
            server_1.prisma.transaction.aggregate({
                where: {
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    createdAt: { gte: fromDate, lte: toDate },
                },
                _sum: { amount: true },
                _count: true,
            }),
            server_1.prisma.transaction.aggregate({
                where: {
                    type: 'WITHDRAWAL',
                    status: 'COMPLETED',
                    createdAt: { gte: fromDate, lte: toDate },
                },
                _sum: { amount: true },
                _count: true,
            }),
            server_1.prisma.transaction.aggregate({
                where: {
                    type: 'PRIZE_CREDIT',
                    status: 'COMPLETED',
                    createdAt: { gte: fromDate, lte: toDate },
                },
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        const ticketSales = await server_1.prisma.transaction.aggregate({
            where: {
                type: 'TICKET_PURCHASE',
                status: 'COMPLETED',
                createdAt: { gte: fromDate, lte: toDate },
            },
            _sum: { amount: true },
            _count: true,
        });
        const totalDeposits = Number(deposits._sum.amount || 0);
        const totalWithdrawals = Number(withdrawals._sum.amount || 0);
        const totalPrizes = Number(prizes._sum.amount || 0);
        const totalTicketRevenue = Math.abs(Number(ticketSales._sum.amount || 0));
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
        });
    });
    // GET /reports/tickets - Ticket sales report
    app.get('/tickets', async (request, reply) => {
        const { from, to, gameId } = request.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        const where = {
            purchasedAt: { gte: fromDate, lte: toDate },
        };
        if (gameId)
            where.gameId = gameId;
        const [totalTickets, byGame, byStatus] = await Promise.all([
            server_1.prisma.ticket.count({ where }),
            server_1.prisma.ticket.groupBy({
                by: ['gameId'],
                where,
                _count: true,
                _sum: { totalCost: true },
            }),
            server_1.prisma.ticket.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
        ]);
        // Enrich with game names
        const gameIds = byGame.map((g) => g.gameId);
        const games = await server_1.prisma.game.findMany({
            where: { id: { in: gameIds } },
            select: { id: true, name: true, slug: true },
        });
        const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));
        const enrichedByGame = byGame.map((g) => ({
            ...g,
            game: gameMap[g.gameId],
        }));
        return reply.send({
            success: true,
            data: {
                period: { from: fromDate, to: toDate },
                totalTickets,
                byGame: enrichedByGame,
                byStatus,
            },
        });
    });
    // GET /reports/users - User registration report
    app.get('/users', async (request, reply) => {
        const { from, to } = request.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        const [total, newUsers, byStatus, byKyc] = await Promise.all([
            server_1.prisma.user.count(),
            server_1.prisma.user.count({
                where: { createdAt: { gte: fromDate, lte: toDate } },
            }),
            server_1.prisma.user.groupBy({
                by: ['status'],
                _count: true,
            }),
            server_1.prisma.user.groupBy({
                by: ['kycStatus'],
                _count: true,
            }),
        ]);
        return reply.send({
            success: true,
            data: {
                period: { from: fromDate, to: toDate },
                totalUsers: total,
                newRegistrations: newUsers,
                byStatus,
                byKycStatus: byKyc,
            },
        });
    });
    // GET /reports/draws - Draw history report
    app.get('/draws', async (request, reply) => {
        const { gameId, page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { status: 'COMPLETED' };
        if (gameId)
            where.gameId = gameId;
        const [draws, total] = await Promise.all([
            server_1.prisma.draw.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { drawnAt: 'desc' },
                include: {
                    game: { select: { name: true, slug: true } },
                    _count: { select: { tickets: true, winningEntries: true } },
                },
            }),
            server_1.prisma.draw.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: draws,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // GET /reports/affiliates - Affiliate performance report
    app.get('/affiliates', async (request, reply) => {
        const affiliates = await server_1.prisma.affiliateAccount.findMany({
            orderBy: { totalEarned: 'desc' },
            take: 50,
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
            },
        });
        const totals = await server_1.prisma.affiliateAccount.aggregate({
            _sum: { totalEarned: true, totalPaid: true, pendingAmount: true },
            _count: true,
        });
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
        });
    });
    // GET /reports/summary - Dashboard summary (last 30 days)
    app.get('/summary', async (request, reply) => {
        const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalUsers, newUsersToday, newUsersWeek, ticketsToday, ticketsWeek, revenueToday, revenueWeek, pendingWithdrawals, pendingKYC, activeDraws,] = await Promise.all([
            server_1.prisma.user.count(),
            server_1.prisma.user.count({ where: { createdAt: { gte: today } } }),
            server_1.prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
            server_1.prisma.ticket.count({ where: { purchasedAt: { gte: today } } }),
            server_1.prisma.ticket.count({ where: { purchasedAt: { gte: lastWeek } } }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: today } },
                _sum: { amount: true },
            }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: lastWeek } },
                _sum: { amount: true },
            }),
            server_1.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
            server_1.prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
            server_1.prisma.draw.count({ where: { status: 'SCHEDULED' } }),
        ]);
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
        });
    });
    // GET /reports/audit-logs - Audit log viewer
    app.get('/audit-logs', async (request, reply) => {
        const { page = '1', limit = '50', userId, action } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userId)
            where.userId = userId;
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        const [logs, total] = await Promise.all([
            server_1.prisma.auditLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { email: true, firstName: true, lastName: true } },
                },
            }),
            server_1.prisma.auditLog.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: logs,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
}
//# sourceMappingURL=reports.js.map