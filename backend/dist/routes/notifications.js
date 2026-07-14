"use strict";
/**
 * Notification Routes
 * - In-app notifications, preferences
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notificationRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const prefsSchema = zod_1.z.object({
    emailDeposit: zod_1.z.boolean().optional(),
    emailWithdrawal: zod_1.z.boolean().optional(),
    emailTicket: zod_1.z.boolean().optional(),
    emailDraw: zod_1.z.boolean().optional(),
    emailWinning: zod_1.z.boolean().optional(),
    emailPromo: zod_1.z.boolean().optional(),
    inAppDeposit: zod_1.z.boolean().optional(),
    inAppWithdrawal: zod_1.z.boolean().optional(),
    inAppTicket: zod_1.z.boolean().optional(),
    inAppDraw: zod_1.z.boolean().optional(),
    inAppWinning: zod_1.z.boolean().optional(),
    inAppPromo: zod_1.z.boolean().optional(),
});
async function notificationRoutes(app) {
    // GET /notifications - List user's notifications
    app.get('/', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '20', unread } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { userId: request.user.userId };
        if (unread === 'true')
            where.isRead = false;
        const [notifications, total, unreadCount] = await Promise.all([
            server_1.prisma.notification.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            server_1.prisma.notification.count({ where }),
            server_1.prisma.notification.count({
                where: { userId: request.user.userId, isRead: false },
            }),
        ]);
        return reply.send({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });
    // PATCH /notifications/:id/read - Mark as read
    app.patch('/:id/read', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        await server_1.prisma.notification.updateMany({
            where: { id, userId: request.user.userId },
            data: { isRead: true, readAt: new Date() },
        });
        return reply.send({ success: true });
    });
    // POST /notifications/read-all - Mark all as read
    app.post('/read-all', { preHandler: auth_1.authenticate }, async (request, reply) => {
        await server_1.prisma.notification.updateMany({
            where: { userId: request.user.userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return reply.send({ success: true, message: 'All notifications marked as read' });
    });
    // DELETE /notifications/:id - Delete notification
    app.delete('/:id', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        await server_1.prisma.notification.deleteMany({
            where: { id, userId: request.user.userId },
        });
        return reply.send({ success: true });
    });
    // GET /notifications/preferences - Get notification preferences
    app.get('/preferences', { preHandler: auth_1.authenticate }, async (request, reply) => {
        let prefs = await server_1.prisma.notificationPreference.findUnique({
            where: { userId: request.user.userId },
        });
        if (!prefs) {
            prefs = await server_1.prisma.notificationPreference.create({
                data: { userId: request.user.userId },
            });
        }
        return reply.send({ success: true, data: prefs });
    });
    // PATCH /notifications/preferences - Update preferences
    app.patch('/preferences', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const body = prefsSchema.parse(request.body);
        const prefs = await server_1.prisma.notificationPreference.upsert({
            where: { userId: request.user.userId },
            update: body,
            create: { userId: request.user.userId, ...body },
        });
        return reply.send({ success: true, data: prefs });
    });
    // GET /notifications/unread-count - Quick unread count
    app.get('/unread-count', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const count = await server_1.prisma.notification.count({
            where: { userId: request.user.userId, isRead: false },
        });
        return reply.send({ success: true, data: { count } });
    });
}
//# sourceMappingURL=notifications.js.map