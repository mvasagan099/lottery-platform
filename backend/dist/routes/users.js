"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
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
        const prefs = await server_1.prisma.notificationPreference.upsert({
            where: { userId: request.user.userId },
            update: request.body,
            create: { userId: request.user.userId, ...request.body },
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
    // Submit KYC document
    app.post('/me/kyc', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { documentType, documentUrl, selfieUrl } = request.body;
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