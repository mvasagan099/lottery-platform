"use strict";
/**
 * Affiliate & Referral Routes
 * - Affiliate dashboard, commissions, referral tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = affiliateRoutes;
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
async function affiliateRoutes(app) {
    // GET /affiliates/me - Get affiliate profile & stats
    app.get('/me', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const userId = request.user.userId;
        let affiliate = await server_1.prisma.affiliateAccount.findUnique({
            where: { userId },
            include: {
                commissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        // Auto-create affiliate account if doesn't exist
        if (!affiliate) {
            const user = await server_1.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
            affiliate = await server_1.prisma.affiliateAccount.create({
                data: {
                    userId,
                    affiliateCode: user.referralCode,
                },
                include: { commissions: true },
            });
        }
        const user = await server_1.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true },
        });
        const realTotalSignups = await server_1.prisma.user.count({
            where: { referredById: userId },
        });
        return reply.send({
            success: true,
            data: {
                ...affiliate,
                totalSignups: Math.max(affiliate.totalSignups, realTotalSignups),
                referralCode: user?.referralCode,
                referralLink: `${process.env.FRONTEND_URL}/register?ref=${user?.referralCode}`,
            },
        });
    });
    // GET /affiliates/commissions - Commission history (paginated)
    app.get('/commissions', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20', type } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const affiliate = await server_1.prisma.affiliateAccount.findUnique({
            where: { userId: request.user.userId },
        });
        if (!affiliate) {
            return reply.send({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
        }
        const where = { affiliateId: affiliate.id };
        if (type)
            where.type = type;
        const [commissions, total] = await Promise.all([
            server_1.prisma.affiliateCommission.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            server_1.prisma.affiliateCommission.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: commissions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });
    // GET /affiliates/referrals - List referred users
    app.get('/referrals', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [referrals, total] = await Promise.all([
            server_1.prisma.user.findMany({
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
            server_1.prisma.user.count({ where: { referredById: request.user.userId } }),
        ]);
        return reply.send({
            success: true,
            data: referrals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });
    // GET /affiliates/stats - Detailed affiliate stats
    app.get('/stats', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const userId = request.user.userId;
        const affiliate = await server_1.prisma.affiliateAccount.findUnique({
            where: { userId },
        });
        if (!affiliate) {
            return reply.send({ success: true, data: { totalEarned: 0, pending: 0, clicks: 0, signups: 0 } });
        }
        const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [recentCommissions, monthlyReferrals] = await Promise.all([
            server_1.prisma.affiliateCommission.findMany({
                where: { affiliateId: affiliate.id, createdAt: { gte: last30days } },
                select: { amount: true, type: true, createdAt: true },
            }),
            server_1.prisma.user.count({
                where: { referredById: userId, createdAt: { gte: last30days } },
            }),
        ]);
        const monthlyEarnings = recentCommissions.reduce((s, c) => s + Number(c.amount), 0);
        const realTotalSignups = await server_1.prisma.user.count({
            where: { referredById: userId },
        });
        return reply.send({
            success: true,
            data: {
                totalEarned: affiliate.totalEarned,
                totalPaid: affiliate.totalPaid,
                pendingAmount: affiliate.pendingAmount,
                totalClicks: affiliate.totalClicks,
                totalSignups: Math.max(affiliate.totalSignups, realTotalSignups),
                totalDeposits: affiliate.totalDeposits,
                commissionRate: affiliate.commissionRate,
                monthlyEarnings,
                monthlyReferrals,
                recentCommissions,
            },
        });
    });
    // ── Admin Affiliate Management ─────────────────────────────────────────────
    // GET /affiliates/admin - List all affiliates & summary stats (admin)
    app.get('/admin', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { page = '1', limit = '10', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status === 'ACTIVE')
            where.isActive = true;
        if (status === 'SUSPENDED')
            where.isActive = false;
        if (search) {
            where.OR = [
                { affiliateCode: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { username: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const orderBy = {};
        orderBy[sortField] = sortDir;
        const [affiliates, total, totalCount, activeCount, aggregates] = await Promise.all([
            server_1.prisma.affiliateAccount.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy,
                include: {
                    user: { select: { email: true, username: true, firstName: true, lastName: true } },
                },
            }),
            server_1.prisma.affiliateAccount.count({ where }),
            server_1.prisma.affiliateAccount.count(),
            server_1.prisma.affiliateAccount.count({ where: { isActive: true } }),
            server_1.prisma.affiliateAccount.aggregate({
                _sum: { totalEarned: true, pendingAmount: true },
            }),
        ]);
        return reply.send({
            success: true,
            data: affiliates,
            stats: {
                totalAffiliates: totalCount,
                activeAffiliates: activeCount,
                totalEarned: Number(aggregates._sum.totalEarned || 0),
                totalPending: Number(aggregates._sum.pendingAmount || 0),
            },
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });
    // GET /affiliates/admin/:id - Single affiliate details (admin)
    app.get('/admin/:id', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const affiliate = await server_1.prisma.affiliateAccount.findUnique({
            where: { id },
            include: {
                user: { select: { email: true, username: true, firstName: true, lastName: true, phone: true, country: true } },
                commissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!affiliate) {
            return reply.status(404).send({ success: false, error: 'Affiliate not found' });
        }
        const realTotalSignups = await server_1.prisma.user.count({
            where: { referredById: affiliate.userId },
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.send({
            success: true,
            data: {
                ...affiliate,
                totalSignups: Math.max(affiliate.totalSignups, realTotalSignups),
                referralLink: `${frontendUrl}/register?ref=${affiliate.affiliateCode}`,
            },
        });
    });
    // PATCH /affiliates/admin/:id - Update affiliate settings/status (admin)
    app.patch('/admin/:id', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const { commissionRate, isActive } = request.body;
        const data = {};
        if (commissionRate !== undefined) {
            if (commissionRate < 0 || commissionRate > 100) {
                return reply.status(400).send({ success: false, error: 'Rate must be between 0 and 100' });
            }
            data.commissionRate = commissionRate;
        }
        if (isActive !== undefined) {
            data.isActive = isActive;
        }
        const affiliate = await server_1.prisma.affiliateAccount.update({
            where: { id },
            data,
        });
        return reply.send({ success: true, message: 'Affiliate updated successfully', data: affiliate });
    });
    // POST /affiliates/admin/bulk-action - Bulk activate/suspend affiliates (admin)
    app.post('/admin/bulk-action', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { recordIds, action } = request.body;
        if (!recordIds || recordIds.length === 0) {
            return reply.status(400).send({ success: false, error: 'No records selected' });
        }
        const isActive = action === 'ACTIVATE';
        await server_1.prisma.affiliateAccount.updateMany({
            where: { id: { in: recordIds } },
            data: { isActive },
        });
        return reply.send({ success: true, message: `Successfully updated ${recordIds.length} affiliates` });
    });
    // GET /affiliates/admin/all - List all affiliates (legacy admin route)
    app.get('/admin/all', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [affiliates, total] = await Promise.all([
            server_1.prisma.affiliateAccount.findMany({
                skip,
                take: Number(limit),
                orderBy: { totalEarned: 'desc' },
                include: {
                    user: { select: { email: true, firstName: true, lastName: true } },
                },
            }),
            server_1.prisma.affiliateAccount.count(),
        ]);
        return reply.send({
            success: true,
            data: affiliates,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // PATCH /affiliates/admin/:id/commission - Update commission rate (admin)
    app.patch('/admin/:id/commission', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const { rate } = request.body;
        if (rate < 0 || rate > 100) {
            return reply.status(400).send({ success: false, error: 'Rate must be between 0 and 100' });
        }
        const affiliate = await server_1.prisma.affiliateAccount.update({
            where: { id },
            data: { commissionRate: rate },
        });
        return reply.send({ success: true, data: affiliate });
    });
    // POST /affiliates/admin/:id/pay - Mark commissions as paid (admin)
    app.post('/admin/:id/pay', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const affiliate = await server_1.prisma.affiliateAccount.findUnique({ where: { id } });
        if (!affiliate)
            return reply.status(404).send({ success: false, error: 'Affiliate not found' });
        const pendingAmount = Number(affiliate.pendingAmount);
        if (pendingAmount === 0) {
            return reply.status(400).send({ success: false, error: 'No pending commissions to pay' });
        }
        await server_1.prisma.$transaction(async (tx) => {
            await tx.affiliateCommission.updateMany({
                where: { affiliateId: id, isPaid: false },
                data: { isPaid: true, paidAt: new Date() },
            });
            await tx.affiliateAccount.update({
                where: { id },
                data: {
                    totalPaid: { increment: pendingAmount },
                    pendingAmount: 0,
                },
            });
        });
        return reply.send({ success: true, message: `$${pendingAmount.toFixed(2)} paid to affiliate` });
    });
}
//# sourceMappingURL=affiliates.js.map