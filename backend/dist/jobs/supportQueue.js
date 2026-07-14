"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const client_1 = require("@prisma/client");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new client_1.PrismaClient();
exports.supportQueue = new bull_1.default('support', redisUrl);
exports.supportQueue.process(async (job) => {
    const { type, data } = job.data;
    if (type === 'AUTO_ASSIGN') {
        const { ticketId, departmentId } = data;
        // Find an agent with the least assigned tickets in the department
        const agents = await prisma.supportAgent.findMany({
            where: {
                departmentId,
                status: 'ONLINE'
            },
            include: {
                _count: {
                    select: { assignedTickets: { where: { status: 'OPEN' } } }
                }
            },
            orderBy: {
                assignedTickets: {
                    _count: 'asc'
                }
            },
            take: 1
        });
        if (agents.length > 0) {
            const bestAgent = agents[0];
            await prisma.supportTicket.update({
                where: { id: ticketId },
                data: { assignedToId: bestAgent.id, status: 'ASSIGNED' }
            });
            await prisma.ticketAssignment.create({
                data: {
                    ticketId,
                    agentId: bestAgent.id,
                    assignedBy: 'SYSTEM'
                }
            });
        }
    }
    if (type === 'CHECK_SLA') {
        const tickets = await prisma.supportTicket.findMany({
            where: {
                status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
                slaDeadline: { lt: new Date() }
            }
        });
        for (const ticket of tickets) {
            await prisma.supportTicket.update({
                where: { id: ticket.id },
                data: { status: 'ESCALATED' }
            });
            // Notify managers or team leads
            // This is a placeholder for notification logic
            await prisma.notification.create({
                data: {
                    userId: ticket.userId || '',
                    title: 'SLA Breached',
                    message: `Ticket ${ticket.ticketNumber} has breached SLA.`,
                }
            });
        }
    }
});
exports.supportQueue.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});
exports.supportQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} has failed with ${err.message}`);
});
// Add recurring job for SLA check
exports.supportQueue.add({ type: 'CHECK_SLA', data: {} }, { repeat: { cron: '*/5 * * * *' } });
//# sourceMappingURL=supportQueue.js.map