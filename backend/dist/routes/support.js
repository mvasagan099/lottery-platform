"use strict";
/**
 * Support Routes
 * - Ticket submission, messaging, FAQ
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = supportRoutes;
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const createTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5).max(200),
    category: zod_1.z.string(),
    message: zod_1.z.string().min(10).max(5000),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});
const addMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(5000),
    isInternal: zod_1.z.boolean().default(false),
});
async function supportRoutes(app) {
    // GET /support/faqs - Public FAQ list
    app.get('/faqs', async (request, reply) => {
        const { category } = request.query;
        const faqs = await server_1.prisma.fAQ.findMany({
            where: { isActive: true, ...(category && { category }) },
            orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
        });
        return reply.send({ success: true, data: faqs });
    });
    // GET /support/tickets - User's support tickets
    app.get('/tickets', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { page = '1', limit = '10' } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [tickets, total] = await Promise.all([
            server_1.prisma.supportTicket.findMany({
                where: { userId: request.user.userId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            }),
            server_1.prisma.supportTicket.count({ where: { userId: request.user.userId } }),
        ]);
        return reply.send({
            success: true,
            data: tickets,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // POST /support/tickets - Submit a support ticket
    app.post('/tickets', {
        preHandler: auth_1.authenticate,
        config: { rateLimit: { max: 50, timeWindow: '1 hour' } },
    }, async (request, reply) => {
        const body = createTicketSchema.parse(request.body);
        const userId = request.user.userId;
        const ticket = await server_1.prisma.$transaction(async (tx) => {
            // Find or create the category
            let categoryRecord = await tx.ticketCategoryModel.findUnique({ where: { name: body.category } });
            if (!categoryRecord) {
                categoryRecord = await tx.ticketCategoryModel.create({ data: { name: body.category } });
            }
            const t = await tx.supportTicket.create({
                data: {
                    userId,
                    subject: body.subject,
                    categoryId: categoryRecord.id,
                    priority: body.priority,
                },
            });
            await tx.supportMessage.create({
                data: {
                    ticketId: t.id,
                    senderId: userId,
                    message: body.message,
                },
            });
            return t;
        });
        return reply.status(201).send({
            success: true,
            message: 'Support ticket submitted',
            data: { ticketId: ticket.id },
        });
    });
    // GET /support/tickets/:id - Get ticket with messages
    app.get('/tickets/:id', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const ticket = await server_1.prisma.supportTicket.findFirst({
            where: {
                id,
                ...(request.user.role !== 'ADMIN' && request.user.role !== 'SUPER_ADMIN' && request.user.role !== 'SUPPORT'
                    ? { userId: request.user.userId }
                    : {}),
            },
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
                messages: {
                    where: { isInternal: false },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!ticket) {
            return reply.status(404).send({ success: false, error: 'Ticket not found' });
        }
        return reply.send({ success: true, data: ticket });
    });
    // POST /support/tickets/:id/messages - Add a message to ticket
    app.post('/tickets/:id/messages', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        const body = addMessageSchema.parse(request.body);
        const userId = request.user.userId;
        const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(request.user.role);
        const ticket = await server_1.prisma.supportTicket.findFirst({
            where: {
                id,
                ...(!isAdminUser && { userId }),
            },
        });
        if (!ticket) {
            return reply.status(404).send({ success: false, error: 'Ticket not found' });
        }
        if (ticket.status === 'CLOSED') {
            return reply.status(400).send({ success: false, error: 'Ticket is closed' });
        }
        const message = await server_1.prisma.supportMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                message: body.message,
                isInternal: isAdminUser && body.isInternal,
            },
        });
        // Update ticket status if admin replied
        if (isAdminUser && ticket.status === 'OPEN') {
            await server_1.prisma.supportTicket.update({
                where: { id },
                data: { status: 'IN_PROGRESS', assignedToId: userId },
            });
            // Notify user
            await server_1.prisma.notification.create({
                data: {
                    userId: ticket.userId,
                    title: 'Support reply received',
                    message: `Your support ticket "${ticket.subject}" has been updated.`,
                    data: { ticketId: id },
                },
            });
        }
        return reply.status(201).send({ success: true, data: message });
    });
    // PATCH /support/tickets/:id/status - Update ticket status (admin)
    app.patch('/tickets/:id/status', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body;
        const ticket = await server_1.prisma.supportTicket.update({
            where: { id },
            data: {
                status: status,
                ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
            },
        });
        return reply.send({ success: true, data: ticket });
    });
    // ── Admin Support Queue ─────────────────────────────────────────────────────
    app.get('/admin/queue', {
        preHandler: [auth_1.authenticate, auth_1.requireAdmin],
    }, async (request, reply) => {
        const { page = '1', limit = '20', status } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        else
            where.status = { in: ['OPEN', 'IN_PROGRESS'] };
        const [tickets, total] = await Promise.all([
            server_1.prisma.supportTicket.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
                include: {
                    user: { select: { email: true, firstName: true, lastName: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
            }),
            server_1.prisma.supportTicket.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: tickets,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    });
    // ── Admin FAQ Management ────────────────────────────────────────────────────
    app.post('/faqs', { preHandler: [auth_1.authenticate, auth_1.requireAdmin] }, async (request, reply) => {
        const { question, answer, category, sortOrder } = request.body;
        const faq = await server_1.prisma.fAQ.create({
            data: { question, answer, category, sortOrder: sortOrder || 0 },
        });
        return reply.status(201).send({ success: true, data: faq });
    });
    app.put('/faqs/:id', { preHandler: [auth_1.authenticate, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const faq = await server_1.prisma.fAQ.update({ where: { id }, data });
        return reply.send({ success: true, data: faq });
    });
    app.delete('/faqs/:id', { preHandler: [auth_1.authenticate, auth_1.requireAdmin] }, async (request, reply) => {
        const { id } = request.params;
        await server_1.prisma.fAQ.delete({ where: { id } });
        return reply.send({ success: true });
    });
}
//# sourceMappingURL=support.js.map