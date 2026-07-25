"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
// HIGH-11: Safe URL validator for KYC documents
const safeHttpsUrl = zod_1.z.string().url().refine((url) => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:')
            return false;
        const host = parsed.hostname;
        // Block internal/private IPs
        if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|localhost)/i.test(host))
            return false;
        return true;
    }
    catch {
        return false;
    }
}, { message: 'URL must be a secure HTTPS URL pointing to an external host' });
const kycSchema = zod_1.z.object({
    documentType: zod_1.z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'UTILITY_BILL']),
    documentUrl: safeHttpsUrl,
    selfieUrl: safeHttpsUrl,
});
// HIGH-02: Whitelist notification preference fields
const notifPrefsSchema = zod_1.z.object({
    emailDeposits: zod_1.z.boolean().optional(),
    emailWithdrawals: zod_1.z.boolean().optional(),
    emailPromotions: zod_1.z.boolean().optional(),
    emailNewsletters: zod_1.z.boolean().optional(),
    pushDeposits: zod_1.z.boolean().optional(),
    pushWithdrawals: zod_1.z.boolean().optional(),
    pushPromotions: zod_1.z.boolean().optional(),
    smsDeposits: zod_1.z.boolean().optional(),
    smsWithdrawals: zod_1.z.boolean().optional(),
    smsPromotions: zod_1.z.boolean().optional(),
});
async function userRoutes(app) {
    app.get('/me', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const user = await server_1.prisma.user.findUnique({
            where: { id: request.user.userId },
            select: {
                id: true, email: true, username: true, firstName: true, lastName: true,
                dateOfBirth: true, phone: true, role: true, status: true,
                emailVerified: true, twoFactorEnabled: true, kycStatus: true,
                referralCode: true, country: true, state: true, city: true,
                address: true, postcode: true, createdAt: true, lastLoginAt: true,
                wallet: { select: { balance: true, bonusBalance: true, pendingBalance: true } },
                notificationPrefs: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } }
                            }
                        }
                    }
                },
            },
        });
        if (!user)
            return reply.status(404).send({ success: false, error: 'User not found' });
        return reply.send({ success: true, data: user });
    });
    app.patch('/me', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { firstName, lastName, phone, country, state, city, address, postcode, dateOfBirth } = request.body;
        const updateData = { firstName, lastName, phone, country, state, city, address, postcode };
        if (dateOfBirth) {
            updateData.dateOfBirth = new Date(dateOfBirth);
        }
        const user = await server_1.prisma.user.update({
            where: { id: request.user.userId },
            data: updateData,
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, country: true, state: true, city: true, address: true, postcode: true,
                dateOfBirth: true,
            },
        });
        await (0, auth_1.auditLog)(request.user.userId, 'PROFILE_UPDATED', 'User', request.user.userId, undefined, undefined, request);
        return reply.send({ success: true, data: user });
    });
    app.patch('/me/notifications', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const validated = notifPrefsSchema.partial().parse(request.body);
        const prefs = await server_1.prisma.notificationPreference.upsert({
            where: { userId: request.user.userId },
            update: validated,
            create: { userId: request.user.userId, ...validated },
        });
        return reply.send({ success: true, data: prefs });
    });
    app.get('/me/devices', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const devices = await server_1.prisma.deviceHistory.findMany({
            where: { userId: request.user.userId },
            orderBy: { lastSeenAt: 'desc' },
        });
        return reply.send({ success: true, data: devices });
    });
    // Submit KYC document — HIGH-11: validates URL safety
    app.post('/me/kyc', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { documentType, documentUrl, selfieUrl } = kycSchema.parse(request.body);
        await server_1.prisma.kYCRecord.create({
            data: {
                userId: request.user.userId,
                documentType,
                documentUrl,
                selfieUrl,
                status: 'PENDING',
            },
        });
        await server_1.prisma.user.update({
            where: { id: request.user.userId },
            data: { kycStatus: 'PENDING' },
        });
        return reply.status(201).send({ success: true, message: 'KYC documents submitted for review' });
    });
    app.get('/me/referrals', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const user = await server_1.prisma.user.findUnique({
            where: { id: request.user.userId },
            select: {
                referralCode: true,
                referrals: {
                    select: {
                        id: true, email: true, firstName: true, createdAt: true,
                        wallet: { select: { totalDeposited: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return reply.send({ success: true, data: user });
    });
}
//# sourceMappingURL=users.js.map