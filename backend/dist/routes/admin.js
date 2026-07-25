"use strict";
/**
 * Admin Routes
 * - User management, KYC approvals, draw management
 * - Financial controls, reports, settings
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const cms_1 = __importDefault(require("./cms"));
const adminSupport_1 = __importDefault(require("./adminSupport"));
const jackpot_1 = __importDefault(require("./jackpot"));
const crypto_1 = __importDefault(require("crypto"));
async function adminRoutes(app) {
    // All admin routes require authentication + admin role/permissions check
    app.addHook('preHandler', auth_1.authenticate);
    app.addHook('preHandler', async (request, reply) => {
        const user = request.user;
        // 1. System-level admins get full bypass
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
            return;
        }
        // 2. Resolve module from URL path
        const url = request.url;
        let moduleName = '';
        if (url.startsWith('/admin/support'))
            moduleName = 'Support';
        else if (url.startsWith('/admin/users'))
            moduleName = 'Users';
        else if (url.startsWith('/admin/kyc'))
            moduleName = 'KYC';
        else if (url.startsWith('/admin/wallet'))
            moduleName = 'Wallets';
        else if (url.startsWith('/admin/withdrawals'))
            moduleName = 'Withdrawals';
        else if (url.startsWith('/admin/games'))
            moduleName = 'Games';
        else if (url.startsWith('/admin/draws'))
            moduleName = 'Draws';
        else if (url.startsWith('/admin/jackpot'))
            moduleName = 'Jackpots';
        else if (url.startsWith('/admin/cms'))
            moduleName = 'CMS';
        else if (url.startsWith('/admin/settings'))
            moduleName = 'Settings';
        else if (url.startsWith('/admin/reports'))
            moduleName = 'Reports';
        else if (url.startsWith('/admin/stats'))
            moduleName = 'Dashboard';
        else if (url === '/admin' || url === '/admin/')
            moduleName = 'Dashboard';
        if (!moduleName) {
            return reply.status(403).send({ success: false, error: 'Forbidden', message: 'Access denied' });
        }
        // 3. Resolve action from HTTP method
        let action = 'View';
        if (request.method === 'POST')
            action = 'Create';
        else if (request.method === 'PUT' || request.method === 'PATCH')
            action = 'Edit';
        else if (request.method === 'DELETE')
            action = 'Delete';
        // 4. Check database for permission
        const userMappings = await server_1.prisma.userRoleMapping.findMany({
            where: { userId: user.userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });
        const hasAccess = userMappings.some(mapping => mapping.role.isActive &&
            mapping.role.permissions.some(rp => rp.permission.module === moduleName && rp.permission.action === action));
        if (!hasAccess) {
            request.log.warn(`RBAC Denied: User ${user.userId} attempted ${action} on ${moduleName}`);
            return reply.status(403).send({
                success: false,
                error: 'Forbidden',
                message: `You lack the required permission: ${moduleName}:${action}`
            });
        }
    });
    // Register Sub-routers
    app.register(cms_1.default, { prefix: '/cms' });
    app.register(adminSupport_1.default, { prefix: '/support' });
    app.register(jackpot_1.default, { prefix: '/jackpot' });
    // ── Dashboard Stats ───────────────────────────────────────────────────────
    app.get('/stats', async (request, reply) => {
        const [totalUsers, activeUsers, pendingKYC, pendingWithdrawals, totalRevenue, todayTickets, activeSessions,] = await Promise.all([
            server_1.prisma.user.count(),
            server_1.prisma.user.count({ where: { status: 'ACTIVE' } }),
            server_1.prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
            server_1.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'DEPOSIT', status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            server_1.prisma.ticket.count({
                where: { purchasedAt: { gte: new Date(Date.now() - 86400000) } },
            }),
            server_1.prisma.session.count({ where: { isActive: true, expiresAt: { gt: new Date() } } }),
        ]);
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
        });
    });
    // ── User Management ───────────────────────────────────────────────────────
    app.get('/users', async (request, reply) => {
        const { page = '1', limit = '20', search, status, role, kycStatus, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
        const skip = (Math.max(1, Number(page) || 1) - 1) * limitNum;
        // HIGH-01: Whitelist allowed sort fields to prevent Prisma injection
        const ALLOWED_SORT_FIELDS = ['createdAt', 'email', 'username', 'status', 'lastLoginAt', 'firstName', 'lastName'];
        const safeSortField = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : 'createdAt';
        const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (role)
            where.role = role;
        if (kycStatus)
            where.kycStatus = kycStatus;
        const orderBy = {};
        orderBy[safeSortField] = safeSortDir;
        const [users, total] = await Promise.all([
            server_1.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
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
                    roles: { include: { role: { select: { name: true } } } },
                },
            }),
            server_1.prisma.user.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: users,
            pagination: { page: Math.max(1, Number(page) || 1), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        });
    });
    app.get('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await server_1.prisma.user.findUnique({
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
                roles: {
                    include: { role: true }
                }
            },
        });
        if (!user)
            return reply.status(404).send({ success: false, error: 'User not found' });
        const { passwordHash, twoFactorSecret, ...safeUser } = user;
        return reply.send({ success: true, data: safeUser });
    });
    app.patch('/users/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, reason } = request.body;
        const oldUser = await server_1.prisma.user.findUnique({ where: { id }, select: { status: true } });
        await server_1.prisma.user.update({ where: { id }, data: { status: status } });
        if (status === 'BANNED' || status === 'SUSPENDED') {
            await server_1.prisma.session.updateMany({ where: { userId: id }, data: { isActive: false } });
        }
        await (0, auth_1.auditLog)(request.user.userId, 'USER_STATUS_CHANGED', 'User', id, { oldStatus: oldUser?.status }, { newStatus: status, reason }, request);
        return reply.send({ success: true, message: `User status changed to ${status}` });
    });
    // POST /users/bulk-action - Bulk suspend/activate/delete
    app.post('/users/bulk-action', async (request, reply) => {
        const { userIds, action } = request.body;
        if (!userIds || userIds.length === 0)
            return reply.status(400).send({ success: false, error: 'No users selected' });
        if (action === 'DELETE') {
            await server_1.prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
        else {
            const status = action === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED';
            await server_1.prisma.user.updateMany({
                where: { id: { in: userIds } },
                data: { status }
            });
        }
        await (0, auth_1.auditLog)(request.user.userId, `BULK_${action}`, 'User', 'Multiple', undefined, { count: userIds.length }, request);
        return reply.send({ success: true, message: `Successfully applied ${action} to ${userIds.length} users` });
    });
    // POST /users/:id/wallet/adjust - Manual wallet adjustment
    app.post('/users/:id/wallet/adjust', async (request, reply) => {
        const { id } = request.params;
        const { amount, reason, type } = request.body;
        if (amount <= 0)
            return reply.status(400).send({ success: false, error: 'Amount must be positive' });
        const user = await server_1.prisma.user.findUnique({ where: { id }, include: { wallet: true } });
        if (!user || !user.wallet)
            return reply.status(404).send({ success: false, error: 'User or wallet not found' });
        if (type === 'DEBIT' && user.wallet.balance.toNumber() < amount) {
            return reply.status(400).send({ success: false, error: 'Insufficient balance for debit' });
        }
        const newBalance = type === 'CREDIT' ? user.wallet.balance.toNumber() + amount : user.wallet.balance.toNumber() - amount;
        await server_1.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: user.wallet.id },
                data: { balance: newBalance }
            });
            await tx.transaction.create({
                data: {
                    userId: id,
                    walletId: user.wallet.id,
                    type: type === 'CREDIT' ? 'BONUS_CREDIT' : 'WITHDRAWAL',
                    amount: amount,
                    balanceBefore: user.wallet.balance,
                    balanceAfter: newBalance,
                    status: 'COMPLETED',
                    reference: `Admin Adjustment: ${reason}`
                }
            });
        });
        await (0, auth_1.auditLog)(request.user.userId, 'WALLET_ADJUSTED', 'Wallet', user.wallet.id, undefined, { type, amount, reason }, request);
        return reply.send({ success: true, message: `Successfully ${type.toLowerCase()}ed $${amount}`, newBalance });
    });
    // ── KYC Management ────────────────────────────────────────────────────────
    app.get('/kyc', async (request, reply) => {
        const { page = '1', limit = '10', search, status, documentType, sortField = 'submittedAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        if (documentType)
            where.documentType = documentType;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { username: { contains: search, mode: 'insensitive' } } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [records, total, totalRequests, pendingReview, approvedToday, rejectedToday] = await Promise.all([
            server_1.prisma.kYCRecord.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { [sortField]: sortDir },
                include: {
                    user: { select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true } },
                },
            }),
            server_1.prisma.kYCRecord.count({ where }),
            server_1.prisma.kYCRecord.count(),
            server_1.prisma.kYCRecord.count({ where: { status: 'PENDING' } }),
            server_1.prisma.kYCRecord.count({ where: { status: 'APPROVED', reviewedAt: { gte: today } } }),
            server_1.prisma.kYCRecord.count({ where: { status: 'REJECTED', reviewedAt: { gte: today } } }),
        ]);
        const stats = { totalRequests, pendingReview, approvedToday, rejectedToday };
        return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats });
    });
    app.get('/kyc/:id', async (request, reply) => {
        const { id } = request.params;
        const record = await server_1.prisma.kYCRecord.findUnique({
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
        });
        if (!record)
            return reply.status(404).send({ success: false, error: 'KYC Record not found' });
        return reply.send({ success: true, data: record });
    });
    app.patch('/kyc/:id/review', async (request, reply) => {
        const { id } = request.params;
        const { status, notes } = request.body;
        const record = await server_1.prisma.kYCRecord.update({
            where: { id },
            data: { status, reviewedById: request.user.userId, reviewNotes: notes, reviewedAt: new Date() },
        });
        await server_1.prisma.user.update({ where: { id: record.userId }, data: { kycStatus: status } });
        await server_1.prisma.notification.create({
            data: {
                userId: record.userId,
                title: `Identity verification ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
                message: status === 'APPROVED' ? 'Your identity has been verified.' : `Verification rejected: ${notes || 'Please resubmit.'}`,
            },
        });
        await (0, auth_1.auditLog)(request.user.userId, `KYC_${status}`, 'KYCRecord', id, undefined, { status, notes }, request);
        return reply.send({ success: true, message: `KYC ${status.toLowerCase()}` });
    });
    app.post('/kyc/bulk-action', async (request, reply) => {
        const { recordIds, action, notes } = request.body;
        if (!recordIds || recordIds.length === 0)
            return reply.status(400).send({ success: false, error: 'No records provided' });
        const records = await server_1.prisma.kYCRecord.findMany({ where: { id: { in: recordIds } } });
        await server_1.prisma.kYCRecord.updateMany({
            where: { id: { in: recordIds } },
            data: { status: action, reviewedById: request.user.userId, reviewNotes: notes, reviewedAt: new Date() }
        });
        for (const record of records) {
            await server_1.prisma.user.update({ where: { id: record.userId }, data: { kycStatus: action } });
            await server_1.prisma.notification.create({
                data: {
                    userId: record.userId,
                    title: `Identity verification ${action === 'APPROVED' ? 'approved' : 'rejected'}`,
                    message: action === 'APPROVED' ? 'Your identity has been verified.' : `Verification rejected: ${notes || 'Please resubmit.'}`,
                },
            });
        }
        await (0, auth_1.auditLog)(request.user.userId, `BULK_KYC_${action}`, 'KYCRecord', 'BULK', undefined, { count: recordIds.length }, request);
        return reply.send({ success: true, message: `Successfully ${action.toLowerCase()} ${recordIds.length} records` });
    });
    // ── Affiliate Management ───────────────────────────────────────────────────
    app.get('/affiliates', async (request, reply) => {
        const { page = '1', limit = '10', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.isActive = status === 'ACTIVE';
        if (search) {
            where.OR = [
                { affiliateCode: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { username: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [records, total, totalAffiliates, activeAffiliates, totalEarned, totalPending] = await Promise.all([
            server_1.prisma.affiliateAccount.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { [sortField]: sortDir },
                include: {
                    user: { select: { id: true, email: true, username: true, country: true } },
                    _count: { select: { commissions: true } }
                },
            }),
            server_1.prisma.affiliateAccount.count({ where }),
            server_1.prisma.affiliateAccount.count(),
            server_1.prisma.affiliateAccount.count({ where: { isActive: true } }),
            server_1.prisma.affiliateAccount.aggregate({ _sum: { totalEarned: true } }),
            server_1.prisma.affiliateAccount.aggregate({ _sum: { pendingAmount: true } }),
        ]);
        const stats = {
            totalAffiliates,
            activeAffiliates,
            totalEarned: totalEarned._sum.totalEarned || 0,
            totalPending: totalPending._sum.pendingAmount || 0
        };
        return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats });
    });
    app.get('/affiliates/:id', async (request, reply) => {
        const { id } = request.params;
        const record = await server_1.prisma.affiliateAccount.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, country: true, createdAt: true } },
                commissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });
        if (!record)
            return reply.status(404).send({ success: false, error: 'Affiliate not found' });
        return reply.send({ success: true, data: record });
    });
    app.patch('/affiliates/:id', async (request, reply) => {
        const { id } = request.params;
        const { isActive, commissionRate } = request.body;
        const dataToUpdate = {};
        if (isActive !== undefined)
            dataToUpdate.isActive = isActive;
        if (commissionRate !== undefined)
            dataToUpdate.commissionRate = commissionRate;
        await server_1.prisma.affiliateAccount.update({ where: { id }, data: dataToUpdate });
        await (0, auth_1.auditLog)(request.user.userId, 'AFFILIATE_UPDATED', 'AffiliateAccount', id, undefined, dataToUpdate, request);
        return reply.send({ success: true, message: 'Affiliate updated successfully' });
    });
    app.post('/affiliates/bulk-action', async (request, reply) => {
        const { recordIds, action } = request.body;
        if (!recordIds || recordIds.length === 0)
            return reply.status(400).send({ success: false, error: 'No records provided' });
        const isActive = action === 'ACTIVATE';
        await server_1.prisma.affiliateAccount.updateMany({
            where: { id: { in: recordIds } },
            data: { isActive }
        });
        await (0, auth_1.auditLog)(request.user.userId, `BULK_AFFILIATE_${action}`, 'AffiliateAccount', 'BULK', undefined, { count: recordIds.length }, request);
        return reply.send({ success: true, message: `Successfully ${action.toLowerCase()}d ${recordIds.length} affiliates` });
    });
    // ── Withdrawal Management ─────────────────────────────────────────────────
    app.get('/withdrawals', async (request, reply) => {
        const { page = '1', limit = '20', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { wallet: { user: { email: { contains: search, mode: 'insensitive' } } } },
                { wallet: { user: { username: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [withdrawals, total, stats] = await Promise.all([
            server_1.prisma.withdrawal.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { [sortField]: sortDir },
                include: {
                    wallet: {
                        include: { user: { select: { id: true, username: true, email: true, country: true } } }
                    }
                }
            }),
            server_1.prisma.withdrawal.count({ where }),
            server_1.prisma.withdrawal.groupBy({
                by: ['status'],
                _count: true,
                _sum: { amount: true }
            })
        ]);
        return reply.send({ success: true, data: withdrawals, pagination: { page: Number(page), limit: Number(limit), total }, stats });
    });
    app.get('/withdrawals/:id', async (request, reply) => {
        const { id } = request.params;
        const withdrawal = await server_1.prisma.withdrawal.findUnique({
            where: { id },
            include: {
                wallet: {
                    include: { user: true }
                }
            }
        });
        if (!withdrawal)
            return reply.status(404).send({ success: false, error: 'Withdrawal not found' });
        return reply.send({ success: true, data: withdrawal });
    });
    app.patch('/withdrawals/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, reviewNotes } = request.body;
        const withdrawal = await server_1.prisma.withdrawal.findUnique({
            where: { id },
            include: { wallet: true }
        });
        if (!withdrawal)
            return reply.status(404).send({ success: false, error: 'Withdrawal not found' });
        const updated = await server_1.prisma.$transaction(async (tx) => {
            // If rejecting, we must refund the user's balance
            if (status === 'CANCELLED' && withdrawal.status !== 'CANCELLED') {
                await tx.wallet.update({
                    where: { id: withdrawal.walletId },
                    data: {
                        balance: { increment: withdrawal.amount },
                        pendingBalance: { decrement: withdrawal.amount }
                    }
                });
            }
            // If completing, we finalize deduction
            if (status === 'COMPLETED' && withdrawal.status !== 'COMPLETED') {
                await tx.wallet.update({
                    where: { id: withdrawal.walletId },
                    data: {
                        pendingBalance: { decrement: withdrawal.amount },
                        totalWithdrawn: { increment: withdrawal.amount }
                    }
                });
            }
            return tx.withdrawal.update({
                where: { id },
                data: {
                    status,
                    reviewNotes,
                    reviewedById: request.user.userId,
                    processedAt: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status) ? new Date() : undefined
                }
            });
        });
        await (0, auth_1.auditLog)(request.user.userId, `WITHDRAWAL_${status}`, 'Withdrawal', id, undefined, { amount: updated.amount, reviewNotes }, request);
        return reply.send({ success: true, data: updated });
    });
    // ── Deposit Management ───────────────────────────────────────────────────
    app.get('/deposits', async (request, reply) => {
        const { page = '1', limit = '20', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { gatewayRef: { contains: search, mode: 'insensitive' } },
                { wallet: { user: { email: { contains: search, mode: 'insensitive' } } } },
                { wallet: { user: { username: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [deposits, total, stats] = await Promise.all([
            server_1.prisma.deposit.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { [sortField]: sortDir },
                include: {
                    wallet: {
                        include: { user: { select: { id: true, username: true, email: true, country: true } } }
                    }
                }
            }),
            server_1.prisma.deposit.count({ where }),
            server_1.prisma.deposit.groupBy({
                by: ['status'],
                _count: true,
                _sum: { amount: true }
            })
        ]);
        return reply.send({ success: true, data: deposits, pagination: { page: Number(page), limit: Number(limit), total }, stats });
    });
    app.get('/deposits/:id', async (request, reply) => {
        const { id } = request.params;
        const deposit = await server_1.prisma.deposit.findUnique({
            where: { id },
            include: {
                wallet: {
                    include: { user: true }
                }
            }
        });
        if (!deposit)
            return reply.status(404).send({ success: false, error: 'Deposit not found' });
        return reply.send({ success: true, data: deposit });
    });
    app.patch('/deposits/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, reviewNotes } = request.body;
        const deposit = await server_1.prisma.deposit.findUnique({
            where: { id },
            include: { wallet: true }
        });
        if (!deposit)
            return reply.status(404).send({ success: false, error: 'Deposit not found' });
        const updated = await server_1.prisma.$transaction(async (tx) => {
            // If we are forcing a pending/failed deposit to completed
            if (status === 'COMPLETED' && deposit.status !== 'COMPLETED') {
                await tx.wallet.update({
                    where: { id: deposit.walletId },
                    data: {
                        balance: { increment: deposit.amount },
                        totalDeposited: { increment: deposit.amount }
                    }
                });
            }
            // If we are reversing a completed deposit
            if ((status === 'FAILED' || status === 'CANCELLED') && deposit.status === 'COMPLETED') {
                await tx.wallet.update({
                    where: { id: deposit.walletId },
                    data: {
                        balance: { decrement: deposit.amount },
                        totalDeposited: { decrement: deposit.amount }
                    }
                });
            }
            return tx.deposit.update({
                where: { id },
                data: {
                    status,
                    processedAt: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status) ? new Date() : undefined
                }
            });
        });
        await (0, auth_1.auditLog)(request.user.userId, `DEPOSIT_${status}`, 'Deposit', id, undefined, { amount: updated.amount, reviewNotes }, request);
        return reply.send({ success: true, data: updated });
    });
    // ── Wallet Management ──────────────────────────────────────────────────────
    app.post('/wallets/:id/adjustment', async (request, reply) => {
        const { id } = request.params;
        const { amount, type, reason } = request.body;
        if (!amount || amount <= 0)
            return reply.status(400).send({ success: false, error: 'Invalid amount' });
        const wallet = await server_1.prisma.wallet.findUnique({ where: { id } });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        await server_1.prisma.$transaction(async (tx) => {
            const data = {};
            let balanceBefore = 0;
            let balanceAfter = 0;
            if (type === 'CREDIT') {
                balanceBefore = Number(wallet.balance);
                balanceAfter = balanceBefore + amount;
                data.balance = { increment: amount };
            }
            else if (type === 'DEBIT') {
                balanceBefore = Number(wallet.balance);
                if (balanceBefore < amount)
                    throw new Error('Insufficient available balance');
                balanceAfter = balanceBefore - amount;
                data.balance = { decrement: amount };
            }
            else if (type === 'BONUS') {
                balanceBefore = Number(wallet.bonusBalance);
                balanceAfter = balanceBefore + amount;
                data.bonusBalance = { increment: amount };
            }
            await tx.wallet.update({
                where: { id },
                data
            });
            await tx.transaction.create({
                data: {
                    userId: wallet.userId,
                    walletId: id,
                    type: type === 'BONUS' ? 'BONUS_CREDIT' : type === 'CREDIT' ? 'DEPOSIT' : 'WITHDRAWAL',
                    status: 'COMPLETED',
                    amount: type === 'DEBIT' ? -amount : amount,
                    balanceBefore,
                    balanceAfter,
                    reference: `ADJ-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`,
                    description: `Admin Adjustment: ${reason}`
                }
            });
        });
        await (0, auth_1.auditLog)(request.user.userId, `WALLET_ADJUSTMENT`, 'Wallet', id, undefined, { amount, type, reason }, request);
        return reply.send({ success: true, message: 'Wallet adjusted successfully' });
    });
    // ── Draw Management ────────────────────────────────────────────────────────
    app.post('/draws', async (request, reply) => {
        const { gameId, drawNumber, scheduledAt, jackpotAmount } = request.body;
        if (!gameId || !drawNumber || !scheduledAt || jackpotAmount === undefined) {
            return reply.status(400).send({ success: false, error: 'Missing required fields' });
        }
        const draw = await server_1.prisma.draw.create({
            data: {
                gameId,
                drawNumber: Number(drawNumber),
                scheduledAt: new Date(scheduledAt),
                jackpotAmount: Number(jackpotAmount),
                status: 'SCHEDULED',
            }
        });
        await (0, auth_1.auditLog)(request.user.userId, 'DRAW_SCHEDULED', 'Draw', draw.id, undefined, { gameId, drawNumber, scheduledAt }, request);
        return reply.send({ success: true, message: 'Draw scheduled successfully', data: draw });
    });
    app.get('/draws', async (request, reply) => {
        const { page = '1', limit = '10', search, status, hideCompleted, sortField, sortDir } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status) {
            where.status = status;
        }
        else if (hideCompleted === 'true') {
            where.status = { not: 'COMPLETED' };
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { game: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        let orderBy = [];
        if (sortField && sortDir) {
            orderBy = [{ [sortField]: sortDir }];
        }
        else if (status === 'SCHEDULED') {
            orderBy = [{ scheduledAt: 'asc' }];
        }
        else if (status === 'COMPLETED') {
            orderBy = [{ scheduledAt: 'desc' }];
        }
        else {
            // Default order: SCHEDULED draws first (scheduledAt asc), then IN_PROGRESS, then COMPLETED (scheduledAt desc)
            orderBy = [
                { status: 'desc' }, // 'SCHEDULED' > 'IN_PROGRESS' > 'COMPLETED' in string comparison
                { scheduledAt: 'asc' },
            ];
        }
        const [records, total, totalDraws, liveDraws, scheduledDraws, totalSales] = await Promise.all([
            server_1.prisma.draw.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy,
                include: {
                    game: { select: { name: true, slug: true, badgeText: true } },
                    _count: { select: { tickets: true } }
                },
            }),
            server_1.prisma.draw.count({ where }),
            server_1.prisma.draw.count(),
            server_1.prisma.draw.count({ where: { status: 'IN_PROGRESS' } }),
            server_1.prisma.draw.count({ where: { status: 'SCHEDULED' } }),
            server_1.prisma.draw.aggregate({ _sum: { totalSales: true } }),
        ]);
        const stats = {
            totalDraws,
            liveDraws,
            scheduledDraws,
            totalSales: totalSales._sum.totalSales || 0
        };
        return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats });
    });
    app.get('/draws/:id', async (request, reply) => {
        const { id } = request.params;
        const record = await server_1.prisma.draw.findUnique({
            where: { id },
            include: {
                game: {
                    include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } }
                },
                _count: { select: { tickets: true } }
            }
        });
        if (!record)
            return reply.status(404).send({ success: false, error: 'Draw not found' });
        return reply.send({ success: true, data: record });
    });
    app.patch('/draws/:id/execute', async (request, reply) => {
        const { id } = request.params;
        const { winningNumbers, powerball } = request.body;
        // In a real system, this would trigger workers to calculate winners.
        // Here we just mark it as COMPLETED and save the numbers.
        const draw = await server_1.prisma.draw.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                drawnAt: new Date(),
                winningNumbers: winningNumbers || [],
                powerball: powerball || null,
                isVerified: true,
                verifiedById: request.user.userId
            }
        });
        await (0, auth_1.auditLog)(request.user.userId, 'DRAW_EXECUTED', 'Draw', id, undefined, { winningNumbers, powerball }, request);
        return reply.send({ success: true, message: 'Draw executed successfully', data: draw });
    });
    app.patch('/draws/:id/publish', async (request, reply) => {
        const { id } = request.params;
        // 1. Fetch draw with tickets
        const draw = await server_1.prisma.draw.findUnique({
            where: { id },
            include: {
                game: {
                    include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } }
                },
                tickets: {
                    include: { numbers: true }
                }
            }
        });
        if (!draw)
            return reply.status(404).send({ success: false, error: 'Draw not found' });
        if (draw.publishedAt)
            return reply.status(400).send({ success: false, error: 'Already published' });
        // 2. Process tickets
        const winningNums = draw.winningNumbers || [];
        const pb = draw.powerball;
        for (const ticket of draw.tickets) {
            if (ticket.status !== 'ACTIVE')
                continue;
            let bestDivision = null;
            let bestPrize = 0;
            for (const line of ticket.numbers) {
                const nums = line.numbers;
                const matched = nums.filter(n => winningNums.includes(n)).length;
                const pbMatched = pb && line.powerball === pb;
                for (const div of draw.game.prizeDivisions) {
                    const numMatch = div.matchNumbers === matched;
                    const pbMatch = !div.matchPB || pbMatched;
                    if (numMatch && pbMatch) {
                        const prizeAmt = Number(div.fixedPrize || draw.jackpotAmount);
                        if (prizeAmt > bestPrize) {
                            bestPrize = prizeAmt;
                            bestDivision = div;
                        }
                        break;
                    }
                }
            }
            if (bestDivision && bestPrize > 0) {
                await server_1.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { status: 'WON', prizeAmount: bestPrize, prizeDivision: bestDivision.divisionName }
                });
                const wallet = await server_1.prisma.wallet.findUnique({ where: { userId: ticket.userId } });
                if (wallet) {
                    await server_1.prisma.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: bestPrize }, totalWon: { increment: bestPrize } }
                    });
                    await server_1.prisma.transaction.create({
                        data: {
                            userId: ticket.userId,
                            walletId: wallet.id,
                            type: 'PRIZE_CREDIT',
                            amount: bestPrize,
                            balanceBefore: wallet.balance,
                            balanceAfter: Number(wallet.balance) + bestPrize,
                            reference: 'admin-pub-' + draw.id + '-' + ticket.id,
                            description: 'Winnings from Draw #' + draw.drawNumber,
                            status: 'COMPLETED'
                        }
                    });
                }
            }
            else {
                await server_1.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { status: 'LOST' }
                });
            }
        }
        // 3. Mark as published
        const updatedDraw = await server_1.prisma.draw.update({
            where: { id },
            data: { publishedAt: new Date() }
        });
        await (0, auth_1.auditLog)(request.user.userId, 'DRAW_PUBLISHED', 'Draw', id, undefined, {}, request);
        return reply.send({ success: true, message: 'Draw results published securely' });
    });
    // ── Game Management ────────────────────────────────────────────────────────
    app.post('/games', async (request, reply) => {
        const data = request.body;
        const game = await server_1.prisma.game.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || '',
                shortDescription: data.shortDescription || '',
                rulesJson: {},
                drawSchedule: data.drawSchedule || '0 0 * * *',
                jackpotAmount: Number(data.jackpotAmount || 0),
                minJackpot: Number(data.minJackpot || 0),
                ticketPrice: Number(data.ticketPrice || 0),
                minNumbers: Number(data.minNumbers || 6),
                maxNumbers: Number(data.maxNumbers || 6),
                numberPool: Number(data.numberPool || 45),
                hasPowerball: Boolean(data.hasPowerball),
                powerballPool: data.hasPowerball ? Number(data.powerballPool || 20) : null,
                isActive: true,
            }
        });
        await (0, auth_1.auditLog)(request.user.userId, 'GAME_CREATED', 'Game', game.id, undefined, data, request);
        return reply.send({ success: true, message: 'Game created successfully', data: game });
    });
    app.get('/games', async (request, reply) => {
        const { page = '1', limit = '10', search, status, sortField = 'createdAt', sortDir = 'desc' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.isActive = status === 'ACTIVE';
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [records, total, totalGames, activeGames, totalJackpots] = await Promise.all([
            server_1.prisma.game.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { [sortField]: sortDir },
                include: {
                    _count: { select: { draws: true, tickets: true } }
                },
            }),
            server_1.prisma.game.count({ where }),
            server_1.prisma.game.count(),
            server_1.prisma.game.count({ where: { isActive: true } }),
            server_1.prisma.game.aggregate({ _sum: { jackpotAmount: true } }),
        ]);
        const stats = {
            totalGames,
            activeGames,
            disabledGames: totalGames - activeGames,
            totalJackpots: totalJackpots._sum.jackpotAmount || 0
        };
        return reply.send({ success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }, stats });
    });
    app.get('/games/:id', async (request, reply) => {
        const { id } = request.params;
        const record = await server_1.prisma.game.findUnique({
            where: { id },
            include: {
                prizeDivisions: { orderBy: { divisionOrder: 'asc' } },
                draws: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!record)
            return reply.status(404).send({ success: false, error: 'Game not found' });
        return reply.send({ success: true, data: record });
    });
    app.patch('/games/:id', async (request, reply) => {
        const { id } = request.params;
        const { isActive, jackpotAmount, ticketPrice } = request.body;
        const dataToUpdate = {};
        if (isActive !== undefined)
            dataToUpdate.isActive = isActive;
        if (jackpotAmount !== undefined)
            dataToUpdate.jackpotAmount = jackpotAmount;
        if (ticketPrice !== undefined)
            dataToUpdate.ticketPrice = ticketPrice;
        await server_1.prisma.game.update({ where: { id }, data: dataToUpdate });
        await (0, auth_1.auditLog)(request.user.userId, 'GAME_UPDATED', 'Game', id, undefined, dataToUpdate, request);
        return reply.send({ success: true, message: 'Game updated successfully' });
    });
    app.patch('/games/:id/divisions', async (request, reply) => {
        const { id } = request.params;
        const { divisions } = request.body;
        // Use a transaction to delete old and create new divisions
        await server_1.prisma.$transaction(async (tx) => {
            await tx.prizeDivision.deleteMany({ where: { gameId: id } });
            if (divisions && divisions.length > 0) {
                await tx.prizeDivision.createMany({
                    data: divisions.map((div, i) => ({
                        id: crypto_1.default.randomUUID(),
                        gameId: id,
                        divisionName: div.divisionName,
                        divisionOrder: div.divisionOrder ?? i + 1,
                        description: div.description || '',
                        fixedPrize: div.fixedPrize ? parseFloat(div.fixedPrize) : null,
                        isJackpot: Boolean(div.isJackpot),
                        matchNumbers: parseInt(div.matchNumbers),
                        matchSupp: div.matchSupp ? parseInt(div.matchSupp) : 0,
                        matchPB: Boolean(div.matchPB)
                    }))
                });
            }
        });
        await (0, auth_1.auditLog)(request.user.userId, 'GAME_DIVISIONS_UPDATED', 'Game', id, undefined, { divisions }, request);
        return reply.send({ success: true, message: 'Prize divisions updated successfully' });
    });
    app.post('/games/bulk-action', async (request, reply) => {
        const { recordIds, action } = request.body;
        if (!recordIds || recordIds.length === 0)
            return reply.status(400).send({ success: false, error: 'No records provided' });
        const isActive = action === 'ENABLE';
        await server_1.prisma.game.updateMany({
            where: { id: { in: recordIds } },
            data: { isActive }
        });
        await (0, auth_1.auditLog)(request.user.userId, `BULK_GAME_${action}`, 'Game', 'BULK', undefined, { count: recordIds.length }, request);
        return reply.send({ success: true, message: `Successfully ${action.toLowerCase()}d ${recordIds.length} games` });
    });
    // ── Stats ───────────────────────────────────────────────────────────────
    app.get('/reports/revenue', async (request, reply) => {
        const { from, to } = request.query;
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to)
            dateFilter.lte = new Date(to);
        const [deposits, withdrawals, ticketSales, prizes] = await Promise.all([
            server_1.prisma.transaction.aggregate({
                where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
                _sum: { amount: true },
                _count: true,
            }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
                _sum: { amount: true },
                _count: true,
            }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'TICKET_PURCHASE', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
                _sum: { amount: true },
                _count: true,
            }),
            server_1.prisma.transaction.aggregate({
                where: { type: 'PRIZE_CREDIT', status: 'COMPLETED', createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        return reply.send({
            success: true,
            data: {
                deposits: { total: deposits._sum.amount || 0, count: deposits._count },
                withdrawals: { total: Math.abs(Number(withdrawals._sum.amount) || 0), count: withdrawals._count },
                ticketSales: { total: Math.abs(Number(ticketSales._sum.amount) || 0), count: ticketSales._count },
                prizes: { total: prizes._sum.amount || 0, count: prizes._count },
                netRevenue: (Number(ticketSales._sum.amount) || 0) - (Number(prizes._sum.amount) || 0),
            },
        });
    });
    // ── System Settings ───────────────────────────────────────────────────────
    app.get('/settings', async (request, reply) => {
        const settings = await server_1.prisma.setting.findMany({ orderBy: { group: 'asc' } });
        return reply.send({ success: true, data: settings });
    });
    app.patch('/settings', async (request, reply) => {
        const updates = request.body;
        await Promise.all(Object.entries(updates).map(([key, value]) => server_1.prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        })));
        return reply.send({ success: true, message: 'Settings updated' });
    });
    // ── Banners / CMS ─────────────────────────────────────────────────────────
    app.get('/banners', async (request, reply) => {
        const banners = await server_1.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
        return reply.send({ success: true, data: banners });
    });
    app.post('/banners', async (request, reply) => {
        const data = request.body;
        const banner = await server_1.prisma.banner.create({ data });
        return reply.status(201).send({ success: true, data: banner });
    });
    app.patch('/banners/:id', async (request, reply) => {
        const { id } = request.params;
        const banner = await server_1.prisma.banner.update({ where: { id }, data: request.body });
        return reply.send({ success: true, data: banner });
    });
    app.delete('/banners/:id', async (request, reply) => {
        const { id } = request.params;
        await server_1.prisma.banner.delete({ where: { id } });
        return reply.send({ success: true, message: 'Banner deleted' });
    });
    // ── Audit Logs ────────────────────────────────────────────────────────────
    app.get('/audit-logs', async (request, reply) => {
        const { page = '1', limit = '50', userId, action, resource } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userId)
            where.userId = userId;
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (resource)
            where.resource = resource;
        const [logs, total] = await Promise.all([
            server_1.prisma.auditLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true, username: true } } },
            }),
            server_1.prisma.auditLog.count({ where }),
        ]);
        return reply.send({ success: true, data: logs, pagination: { page: Number(page), limit: Number(limit), total } });
    });
}
// Helper: determine prize division based on matches
function getDivision(game, matchCount, hasSupp, hasPB) {
    if (game.slug === 'powerball') {
        if (matchCount === 7 && hasPB)
            return 'Division 1';
        if (matchCount === 7)
            return 'Division 2';
        if (matchCount === 6 && hasPB)
            return 'Division 3';
        if (matchCount === 6)
            return 'Division 4';
        if (matchCount === 5 && hasPB)
            return 'Division 5';
        if (matchCount === 5)
            return 'Division 6';
        if (matchCount === 4 && hasPB)
            return 'Division 7';
        if (matchCount === 3 && hasPB)
            return 'Division 8';
        if (matchCount === 2 && hasPB)
            return 'Division 9';
        return null;
    }
    // MegaDraw / Saturday Lotto defaults
    if (matchCount === 7)
        return 'Division 1';
    if (matchCount === 6 && hasSupp)
        return 'Division 2';
    if (matchCount === 6)
        return 'Division 3';
    if (matchCount === 5 && hasSupp)
        return 'Division 4';
    if (matchCount === 5)
        return 'Division 5';
    if (matchCount === 4)
        return 'Division 6';
    if (matchCount === 3 && hasSupp)
        return 'Division 7';
    return null;
}
function getPrizeForDivision(draw, division) {
    if (division === 'Division 1')
        return Number(draw.jackpotAmount);
    const prizes = {
        'Division 2': 50000,
        'Division 3': 4000,
        'Division 4': 200,
        'Division 5': 30,
        'Division 6': 20,
        'Division 7': 10,
        'Division 8': 7,
        'Division 9': 4,
    };
    return prizes[division] || 0;
}
//# sourceMappingURL=admin.js.map