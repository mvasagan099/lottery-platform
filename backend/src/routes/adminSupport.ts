import { FastifyInstance } from 'fastify';
import { SupportAgentController } from '../controllers/supportAgent.controller';
import { SupportTicketController } from '../controllers/supportTicket.controller';
import { LiveChatController } from '../controllers/liveChat.controller';
import { SupportAnalyticsController } from '../controllers/supportAnalytics.controller';

export default async function adminSupportRoutes(app: FastifyInstance) {
  // Support Dashboard & Analytics
  app.get('/dashboard', SupportAnalyticsController.getDashboard);
  app.get('/analytics', SupportAnalyticsController.getReports);
  app.get('/reports', SupportAnalyticsController.getReports);

  // Live Chat WebSocket
  app.get('/chat', { websocket: true }, LiveChatController.handleConnection);

  // Tickets
  app.get('/tickets', SupportTicketController.listTickets);
  app.get('/tickets/:id', SupportTicketController.getTicket);
  app.post('/tickets', SupportTicketController.createTicket);
  app.patch('/tickets/:id', SupportTicketController.updateTicket);
  app.post('/tickets/:id/reply', SupportTicketController.replyToTicket);
  app.post('/tickets/:id/assign', SupportTicketController.assignTicket);

  app.post('/tickets/:id/close', async (request: any, reply: any) => {
    // Assuming close uses updateTicket
    request.body = { status: 'CLOSED' };
    return SupportTicketController.updateTicket(request, reply);
  });

  app.post('/tickets/:id/reopen', async (request: any, reply: any) => {
    request.body = { status: 'OPEN' };
    return SupportTicketController.updateTicket(request, reply);
  });

  app.post('/tickets/:id/escalate', async (request: any, reply: any) => {
    request.body = { status: 'ESCALATED' };
    return SupportTicketController.updateTicket(request, reply);
  });

  // Agents
  app.get('/agents', SupportAgentController.listAgents);
  app.post('/agents', SupportAgentController.createAgent);
  app.patch('/agents/:id', SupportAgentController.updateAgent);
  app.delete('/agents/:id', SupportAgentController.deleteAgent);
}
