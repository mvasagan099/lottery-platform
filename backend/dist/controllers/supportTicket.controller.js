"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketController = void 0;
const supportTicket_service_1 = require("../services/supportTicket.service");
const support_validator_1 = require("../validators/support.validator");
class SupportTicketController {
    static async createTicket(request, reply) {
        try {
            const data = support_validator_1.createTicketSchema.parse(request.body);
            const user = request.user;
            const ticket = await supportTicket_service_1.SupportTicketService.createTicket(data, user?.id);
            return reply.status(201).send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async getTicket(request, reply) {
        try {
            const ticket = await supportTicket_service_1.SupportTicketService.getTicketById(request.params.id);
            if (!ticket) {
                return reply.status(404).send({ success: false, error: 'Ticket not found' });
            }
            return reply.send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async updateTicket(request, reply) {
        try {
            const data = support_validator_1.updateTicketSchema.parse(request.body);
            const ticket = await supportTicket_service_1.SupportTicketService.updateTicket(request.params.id, data);
            return reply.send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async listTickets(request, reply) {
        try {
            const tickets = await supportTicket_service_1.SupportTicketService.listTickets(request.query);
            const formattedTickets = tickets.map((t) => ({
                ...t,
                userEmail: t.user?.email || 'Unknown',
                username: t.user?.username || t.user?.firstName || 'Unknown',
                category: t.category?.name || t.categoryId || 'GENERAL',
            }));
            return reply.send({
                success: true,
                data: formattedTickets,
                pagination: {
                    total: tickets.length,
                    pages: 1,
                    page: 1,
                    limit: 100
                }
            });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async replyToTicket(request, reply) {
        try {
            const data = support_validator_1.replyTicketSchema.parse(request.body);
            const user = request.user;
            const senderId = user.userId; // JWT contains userId
            const senderType = user.role === 'USER' ? 'USER' : 'AGENT';
            const message = await supportTicket_service_1.SupportTicketService.replyToTicket(request.params.id, senderId, senderType, data.message, data.isInternal);
            return reply.send({ success: true, data: message });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async assignTicket(request, reply) {
        try {
            const data = support_validator_1.assignTicketSchema.parse(request.body);
            const user = request.user; // The person assigning
            const ticket = await supportTicket_service_1.SupportTicketService.assignTicket(request.params.id, data.agentId, user?.userId);
            return reply.send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
}
exports.SupportTicketController = SupportTicketController;
//# sourceMappingURL=supportTicket.controller.js.map