import { FastifyRequest, FastifyReply } from 'fastify';
import { SupportTicketService } from '../services/supportTicket.service';
import { createTicketSchema, updateTicketSchema, replyTicketSchema, assignTicketSchema } from '../validators/support.validator';

export class SupportTicketController {
  static async createTicket(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createTicketSchema.parse(request.body);
      const user = (request as any).user;
      const ticket = await SupportTicketService.createTicket(data, user?.id);
      return reply.status(201).send({ success: true, data: ticket });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async getTicket(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const ticket = await SupportTicketService.getTicketById(request.params.id);
      if (!ticket) {
        return reply.status(404).send({ success: false, error: 'Ticket not found' });
      }
      return reply.send({ success: true, data: ticket });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async updateTicket(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = updateTicketSchema.parse(request.body);
      const ticket = await SupportTicketService.updateTicket(request.params.id, data);
      return reply.send({ success: true, data: ticket });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async listTickets(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    try {
      const tickets = await SupportTicketService.listTickets(request.query);
      
      const formattedTickets = tickets.map((t: any) => ({
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
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async replyToTicket(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = replyTicketSchema.parse(request.body);
      const user = (request as any).user;
      const senderId = user.userId; // JWT contains userId
      const senderType = user.role === 'USER' ? 'USER' : 'AGENT';
      
      const message = await SupportTicketService.replyToTicket(request.params.id, senderId, senderType, data.message, data.isInternal);
      return reply.send({ success: true, data: message });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async assignTicket(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = assignTicketSchema.parse(request.body);
      const user = (request as any).user; // The person assigning
      const ticket = await SupportTicketService.assignTicket(request.params.id, data.agentId, user?.id);
      return reply.send({ success: true, data: ticket });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }
}
