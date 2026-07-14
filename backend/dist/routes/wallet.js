"use strict";
/**
 * Wallet Routes
 * - Balance, deposits, withdrawals, transaction history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = walletRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const depositSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().min(10).max(10000),
    gateway: zod_1.z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']),
    paymentMethodId: zod_1.z.string().optional(),
});
const withdrawalSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().min(10).max(50000),
    gateway: zod_1.z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER']),
    accountDetails: zod_1.z.object({
        accountName: zod_1.z.string(),
        accountNumber: zod_1.z.string().optional(),
        bsb: zod_1.z.string().optional(),
        paypalEmail: zod_1.z.string().email().optional(),
    }),
});
const redeemSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(50),
});
async function walletRoutes(app) {
    // GET /wallet - Get wallet info
    app.get('/', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const wallet = await server_1.prisma.wallet.findUnique({
            where: { userId: request.user.userId },
            select: {
                id: true,
                balance: true,
                bonusBalance: true,
                pendingBalance: true,
                currency: true,
                totalDeposited: true,
                totalWithdrawn: true,
                totalWon: true,
                totalSpent: true,
            },
        });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        return reply.send({ success: true, data: wallet });
    });
    // GET /wallet/transactions - Transaction history
    app.get('/transactions', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20', type, status } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { userId: request.user.userId };
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        const [transactions, total] = await Promise.all([
            server_1.prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    type: true,
                    status: true,
                    amount: true,
                    balanceBefore: true,
                    balanceAfter: true,
                    currency: true,
                    reference: true,
                    description: true,
                    createdAt: true,
                },
            }),
            server_1.prisma.transaction.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });
    // POST /wallet/deposit - Initiate deposit
    app.post('/deposit', {
        preHandler: [auth_1.authenticate, auth_1.requireVerifiedEmail],
        config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    }, async (request, reply) => {
        const body = depositSchema.parse(request.body);
        const userId = request.user.userId;
        const wallet = await server_1.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        // Create pending deposit
        const deposit = await server_1.prisma.deposit.create({
            data: {
                walletId: wallet.id,
                amount: body.amount,
                gateway: body.gateway,
                status: 'PENDING',
            },
        });
        // In real implementation, initiate payment gateway here
        // For Stripe: create payment intent, return client secret
        // For now, return deposit ID for mock flow
        let gatewayData = { depositId: deposit.id };
        if (body.gateway === 'STRIPE') {
            // Mock Stripe payment intent
            gatewayData.clientSecret = `pi_mock_${deposit.id}_secret`;
            gatewayData.amount = body.amount * 100; // cents
        }
        else if (body.gateway === 'PAYPAL') {
            gatewayData.approvalUrl = `https://paypal.com/checkoutnow?token=mock_${deposit.id}`;
        }
        else if (body.gateway === 'BANK_TRANSFER') {
            gatewayData.bankDetails = {
                accountName: 'MegaDraw Pty Ltd',
                bsb: '123-456',
                accountNumber: '123456789',
                reference: `DEP-${deposit.id.substring(0, 8).toUpperCase()}`,
            };
        }
        await (0, auth_1.auditLog)(userId, 'DEPOSIT_INITIATED', 'Deposit', deposit.id, undefined, { amount: body.amount, gateway: body.gateway }, request);
        return reply.status(201).send({
            success: true,
            message: 'Deposit initiated',
            data: { depositId: deposit.id, ...gatewayData },
        });
    });
    // POST /wallet/deposit/:id/confirm - Confirm deposit (webhook or manual)
    app.post('/deposit/:id/confirm', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const { gatewayRef } = request.body;
        const userId = request.user.userId;
        const deposit = await server_1.prisma.deposit.findFirst({
            where: { id, wallet: { userId } },
            include: { wallet: true },
        });
        if (!deposit)
            return reply.status(404).send({ success: false, error: 'Deposit not found' });
        if (deposit.status !== 'PENDING') {
            return reply.status(400).send({ success: false, error: 'Deposit already processed' });
        }
        await server_1.prisma.$transaction(async (tx) => {
            // Update deposit
            await tx.deposit.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    gatewayRef,
                    processedAt: new Date(),
                },
            });
            const balBefore = Number(deposit.wallet.balance);
            const amount = Number(deposit.amount);
            // Credit wallet
            await tx.wallet.update({
                where: { id: deposit.walletId },
                data: {
                    balance: { increment: amount },
                    totalDeposited: { increment: amount },
                },
            });
            // Log transaction
            await tx.transaction.create({
                data: {
                    userId,
                    walletId: deposit.walletId,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    amount,
                    balanceBefore: balBefore,
                    balanceAfter: balBefore + amount,
                    reference: `DEP-${id.substring(0, 8).toUpperCase()}`,
                    description: `Deposit via ${deposit.gateway}`,
                },
            });
        });
        // Notify user
        await server_1.prisma.notification.create({
            data: {
                userId,
                title: 'Deposit confirmed',
                message: `$${deposit.amount} AUD has been added to your wallet.`,
            },
        });
        return reply.send({ success: true, message: 'Deposit confirmed' });
    });
    // POST /wallet/withdraw - Request withdrawal
    app.post('/withdraw', {
        preHandler: [auth_1.authenticate, auth_1.requireVerifiedEmail],
        config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    }, async (request, reply) => {
        const body = withdrawalSchema.parse(request.body);
        const userId = request.user.userId;
        const wallet = await server_1.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true },
        });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        if (Number(wallet.balance) < body.amount) {
            return reply.status(400).send({
                success: false,
                error: 'Insufficient balance for withdrawal',
            });
        }
        // Check KYC
        const user = await server_1.prisma.user.findUnique({
            where: { id: userId },
            select: { kycStatus: true },
        });
        if (user?.kycStatus !== 'APPROVED') {
            return reply.status(403).send({
                success: false,
                error: 'Identity verification required before withdrawing funds',
                code: 'KYC_REQUIRED',
            });
        }
        await server_1.prisma.$transaction(async (tx) => {
            // Create withdrawal request
            await tx.withdrawal.create({
                data: {
                    walletId: wallet.id,
                    amount: body.amount,
                    gateway: body.gateway,
                    accountDetails: body.accountDetails,
                    status: 'PENDING',
                },
            });
            // Reserve funds
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: body.amount },
                    pendingBalance: { increment: body.amount },
                },
            });
        });
        await (0, auth_1.auditLog)(userId, 'WITHDRAWAL_REQUESTED', 'Withdrawal', undefined, undefined, { amount: body.amount }, request);
        // Notify user
        await server_1.prisma.notification.create({
            data: {
                userId,
                title: 'Withdrawal request received',
                message: `Your withdrawal of $${body.amount} AUD is being processed.`,
            },
        });
        return reply.status(201).send({
            success: true,
            message: 'Withdrawal request submitted. Processing within 1-3 business days.',
        });
    });
    // GET /wallet/deposits - Deposit history
    app.get('/deposits', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const wallet = await server_1.prisma.wallet.findUnique({
            where: { userId: request.user.userId },
            select: { id: true },
        });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        const [deposits, total] = await Promise.all([
            server_1.prisma.deposit.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            server_1.prisma.deposit.count({ where: { walletId: wallet.id } }),
        ]);
        return reply.send({
            success: true,
            data: deposits,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // GET /wallet/withdrawals - Withdrawal history
    app.get('/withdrawals', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const wallet = await server_1.prisma.wallet.findUnique({
            where: { userId: request.user.userId },
            select: { id: true },
        });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        const [withdrawals, total] = await Promise.all([
            server_1.prisma.withdrawal.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    amount: true,
                    gateway: true,
                    status: true,
                    processedAt: true,
                    createdAt: true,
                },
            }),
            server_1.prisma.withdrawal.count({ where: { walletId: wallet.id } }),
        ]);
        return reply.send({
            success: true,
            data: withdrawals,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // POST /wallet/redeem - Redeem a coupon code
    app.post('/redeem', { preHandler: [auth_1.authenticate, auth_1.requireVerifiedEmail] }, async (request, reply) => {
        const body = redeemSchema.parse(request.body);
        const userId = request.user.userId;
        const wallet = await server_1.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            return reply.status(404).send({ success: false, error: 'Wallet not found' });
        const codeUpper = body.code.trim().toUpperCase();
        // Needs to use raw query because Prisma Client might not have Coupon types generated locally due to EPERM
        const coupons = await server_1.prisma.$queryRaw `SELECT * FROM "coupons" WHERE "code" = ${codeUpper} LIMIT 1`;
        const coupon = coupons[0];
        if (!coupon) {
            return reply.status(404).send({ success: false, error: 'Invalid coupon code' });
        }
        if (coupon.isUsed) {
            return reply.status(400).send({ success: false, error: 'Coupon code has already been redeemed' });
        }
        await server_1.prisma.$transaction(async (tx) => {
            // Mark used
            await tx.$executeRaw `UPDATE "coupons" SET "isUsed" = true, "usedById" = ${userId}, "usedAt" = NOW() WHERE "id" = ${coupon.id}`;
            const amount = Number(coupon.amount);
            const balBefore = Number(wallet.balance);
            // Credit wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    totalDeposited: { increment: amount },
                },
            });
            // Log transaction
            await tx.transaction.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    amount,
                    balanceBefore: balBefore,
                    balanceAfter: balBefore + amount,
                    reference: `CPN-${coupon.code}`,
                    description: 'Coupon Redemption',
                },
            });
        });
        await (0, auth_1.auditLog)(userId, 'COUPON_REDEEMED', 'Deposit', undefined, undefined, { code: codeUpper, amount: Number(coupon.amount) }, request);
        // Notify user
        await server_1.prisma.notification.create({
            data: {
                userId,
                title: 'Coupon Redeemed',
                message: `${Number(coupon.amount).toFixed(2)} Coins have been added to your wallet.`,
            },
        });
        return reply.send({ success: true, message: 'Coupon redeemed successfully', data: { amount: Number(coupon.amount) } });
    });
}
//# sourceMappingURL=wallet.js.map