"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportAnalyticsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SupportAnalyticsController {
    static async getDashboard(request, reply) {
        try {
            const [openTickets, resolvedTickets, unassignedTickets, activeAgents] = await Promise.all([
                prisma.supportTicket.count({ where: { status: 'OPEN' } }),
                prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
                prisma.supportTicket.count({ where: { assignedToId: null } }),
                prisma.supportAgent.count({ where: { status: 'ONLINE' } })
            ]);
            return reply.send({
                success: true,
                data: {
                    openTickets,
                    resolvedTickets,
                    unassignedTickets,
                    activeAgents
                }
            });
        }
        catch (error) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    }
    static async getReports(request, reply) {
        try {
            // Mocked advanced report for demonstration
            const agentPerformance = await prisma.agentPerformance.findMany({
                include: { agent: { include: { user: { select: { firstName: true, lastName: true } } } } }
            });
            return reply.send({
                success: true,
                data: {
                    agentPerformance,
                    averageResolutionTime: '2 hours',
                    customerSatisfaction: '4.8/5.0'
                }
            });
        }
        catch (error) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    }
}
exports.SupportAnalyticsController = SupportAnalyticsController;
//# sourceMappingURL=supportAnalytics.controller.js.map