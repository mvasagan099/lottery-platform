"use strict";
/**
 * Payment Routes
 * - Stripe & PayPal webhooks
 * - Payment method management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = paymentRoutes;
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
async function paymentRoutes(app) {
    // GET /payments/methods - Available payment methods
    app.get('/methods', async (request, reply) => {
        const methods = await server_1.prisma.paymentMethod.findMany({
            where: { isActive: true },
            select: {
                id: true,
                gateway: true,
                name: true,
                description: true,
                minAmount: true,
                maxAmount: true,
                fees: true,
            },
        });
        return reply.send({ success: true, data: methods });
    });
    // GET /payments/methods/all - All payment methods (admin)
    app.get('/methods/all', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const methods = await server_1.prisma.paymentMethod.findMany({
            orderBy: { gateway: 'asc' },
        });
        return reply.send({ success: true, data: methods });
    });
    // POST /payments/methods - Create payment method (admin)
    app.post('/methods', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const data = request.body;
        const method = await server_1.prisma.paymentMethod.create({ data });
        return reply.status(201).send({ success: true, data: method });
    });
    // PUT /payments/methods/:id - Update payment method (admin)
    app.put('/methods/:id', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const method = await server_1.prisma.paymentMethod.update({ where: { id }, data });
        return reply.send({ success: true, data: method });
    });
    // POST /payments/stripe/webhook - Stripe webhook handler
    app.post('/stripe/webhook', {
        config: { rawBody: true },
    }, async (request, reply) => {
        const sig = request.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !webhookSecret) {
            return reply.status(400).send({ error: 'Missing signature' });
        }
        // In production, verify Stripe signature:
        // const event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret)
        const event = request.body;
        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const pi = event.data.object;
                    // Find deposit by gateway reference
                    const deposit = await server_1.prisma.deposit.findFirst({
                        where: { gatewayRef: pi.id, status: 'PENDING' },
                        include: { wallet: true },
                    });
                    if (deposit) {
                        await server_1.prisma.$transaction(async (tx) => {
                            await tx.deposit.update({
                                where: { id: deposit.id },
                                data: { status: 'COMPLETED', processedAt: new Date() },
                            });
                            const balBefore = Number(deposit.wallet.balance);
                            const amount = Number(deposit.amount);
                            await tx.wallet.update({
                                where: { id: deposit.walletId },
                                data: {
                                    balance: { increment: amount },
                                    totalDeposited: { increment: amount },
                                },
                            });
                            await tx.transaction.create({
                                data: {
                                    userId: deposit.wallet.userId,
                                    walletId: deposit.walletId,
                                    type: 'DEPOSIT',
                                    status: 'COMPLETED',
                                    amount,
                                    balanceBefore: balBefore,
                                    balanceAfter: balBefore + amount,
                                    reference: `STRIPE-${pi.id.substring(0, 8)}`,
                                    description: 'Stripe deposit',
                                },
                            });
                        });
                        await server_1.prisma.notification.create({
                            data: {
                                userId: deposit.wallet.userId,
                                title: 'Deposit confirmed',
                                message: `$${deposit.amount} USD has been added to your wallet.`,
                            },
                        });
                    }
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const pi = event.data.object;
                    await server_1.prisma.deposit.updateMany({
                        where: { gatewayRef: pi.id },
                        data: { status: 'FAILED' },
                    });
                    break;
                }
            }
            return reply.send({ received: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    // POST /payments/paypal/webhook - PayPal webhook handler
    app.post('/paypal/webhook', async (request, reply) => {
        const event = request.body;
        try {
            if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
                const captureId = event.resource.id;
                const deposit = await server_1.prisma.deposit.findFirst({
                    where: { gatewayRef: captureId, status: 'PENDING' },
                    include: { wallet: true },
                });
                if (deposit) {
                    const balBefore = Number(deposit.wallet.balance);
                    const amount = Number(deposit.amount);
                    await server_1.prisma.$transaction(async (tx) => {
                        await tx.deposit.update({
                            where: { id: deposit.id },
                            data: { status: 'COMPLETED', processedAt: new Date() },
                        });
                        await tx.wallet.update({
                            where: { id: deposit.walletId },
                            data: {
                                balance: { increment: amount },
                                totalDeposited: { increment: amount },
                            },
                        });
                        await tx.transaction.create({
                            data: {
                                userId: deposit.wallet.userId,
                                walletId: deposit.walletId,
                                type: 'DEPOSIT',
                                status: 'COMPLETED',
                                amount,
                                balanceBefore: balBefore,
                                balanceAfter: balBefore + amount,
                                reference: `PP-${captureId.substring(0, 8)}`,
                                description: 'PayPal deposit',
                            },
                        });
                    });
                }
            }
            return reply.send({ received: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    // GET /payments/withdrawals/pending - Pending withdrawals (admin)
    app.get('/withdrawals/pending', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { page = '1', limit = '20' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [withdrawals, total] = await Promise.all([
            server_1.prisma.withdrawal.findMany({
                where: { status: 'PENDING' },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'asc' },
                include: {
                    wallet: {
                        include: {
                            user: { select: { email: true, firstName: true, lastName: true } },
                        },
                    },
                },
            }),
            server_1.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
        ]);
        return reply.send({
            success: true,
            data: withdrawals,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // POST /payments/withdrawals/:id/approve - Approve withdrawal (admin)
    app.post('/withdrawals/:id/approve', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const withdrawal = await server_1.prisma.withdrawal.findUnique({
            where: { id },
            include: { wallet: true },
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return reply.status(400).send({ success: false, error: 'Withdrawal not found or not pending' });
        }
        await server_1.prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    reviewedById: request.user.userId,
                    processedAt: new Date(),
                },
            });
            const balBefore = Number(withdrawal.wallet.balance) + Number(withdrawal.wallet.pendingBalance);
            const amount = Number(withdrawal.amount);
            await tx.wallet.update({
                where: { id: withdrawal.walletId },
                data: {
                    pendingBalance: { decrement: amount },
                    totalWithdrawn: { increment: amount },
                },
            });
            await tx.transaction.create({
                data: {
                    userId: withdrawal.wallet.userId,
                    walletId: withdrawal.walletId,
                    type: 'WITHDRAWAL',
                    status: 'COMPLETED',
                    amount: -amount,
                    balanceBefore: balBefore,
                    balanceAfter: balBefore - amount,
                    reference: `WD-${id.substring(0, 8).toUpperCase()}`,
                    description: `Withdrawal via ${withdrawal.gateway}`,
                },
            });
        });
        await server_1.prisma.notification.create({
            data: {
                userId: withdrawal.wallet.userId,
                title: 'Withdrawal processed',
                message: `Your withdrawal of $${withdrawal.amount} USD has been processed.`,
            },
        });
        return reply.send({ success: true, message: 'Withdrawal approved and processed' });
    });
    // POST /payments/withdrawals/:id/reject - Reject withdrawal (admin)
    app.post('/withdrawals/:id/reject', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const { reason } = request.body;
        const withdrawal = await server_1.prisma.withdrawal.findUnique({
            where: { id },
            include: { wallet: true },
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return reply.status(400).send({ success: false, error: 'Withdrawal not found or not pending' });
        }
        await server_1.prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    reviewedById: request.user.userId,
                    reviewNotes: reason,
                },
            });
            // Return funds to main balance
            await tx.wallet.update({
                where: { id: withdrawal.walletId },
                data: {
                    balance: { increment: Number(withdrawal.amount) },
                    pendingBalance: { decrement: Number(withdrawal.amount) },
                },
            });
        });
        await server_1.prisma.notification.create({
            data: {
                userId: withdrawal.wallet.userId,
                title: 'Withdrawal rejected',
                message: `Your withdrawal of $${withdrawal.amount} USD was rejected. Funds have been returned to your wallet. Reason: ${reason}`,
            },
        });
        return reply.send({ success: true, message: 'Withdrawal rejected' });
    });
}
//# sourceMappingURL=payments.js.map