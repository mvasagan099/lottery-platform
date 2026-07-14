"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminSupportRoutes;
const supportAgent_controller_1 = require("../controllers/supportAgent.controller");
const supportTicket_controller_1 = require("../controllers/supportTicket.controller");
const liveChat_controller_1 = require("../controllers/liveChat.controller");
const supportAnalytics_controller_1 = require("../controllers/supportAnalytics.controller");
async function adminSupportRoutes(app) {
    // Support Dashboard & Analytics
    app.get('/dashboard', supportAnalytics_controller_1.SupportAnalyticsController.getDashboard);
    app.get('/analytics', supportAnalytics_controller_1.SupportAnalyticsController.getReports);
    app.get('/reports', supportAnalytics_controller_1.SupportAnalyticsController.getReports);
    // Live Chat WebSocket
    app.get('/chat', { websocket: true }, liveChat_controller_1.LiveChatController.handleConnection);
    // Tickets
    app.get('/tickets', supportTicket_controller_1.SupportTicketController.listTickets);
    app.get('/tickets/:id', supportTicket_controller_1.SupportTicketController.getTicket);
    app.post('/tickets', supportTicket_controller_1.SupportTicketController.createTicket);
    app.patch('/tickets/:id', supportTicket_controller_1.SupportTicketController.updateTicket);
    app.post('/tickets/:id/reply', supportTicket_controller_1.SupportTicketController.replyToTicket);
    app.post('/tickets/:id/assign', supportTicket_controller_1.SupportTicketController.assignTicket);
    app.post('/tickets/:id/close', async (request, reply) => {
        // Assuming close uses updateTicket
        request.body = { status: 'CLOSED' };
        return supportTicket_controller_1.SupportTicketController.updateTicket(request, reply);
    });
    app.post('/tickets/:id/reopen', async (request, reply) => {
        request.body = { status: 'OPEN' };
        return supportTicket_controller_1.SupportTicketController.updateTicket(request, reply);
    });
    app.post('/tickets/:id/escalate', async (request, reply) => {
        request.body = { status: 'ESCALATED' };
        return supportTicket_controller_1.SupportTicketController.updateTicket(request, reply);
    });
    // Agents
    app.get('/agents', supportAgent_controller_1.SupportAgentController.listAgents);
    app.post('/agents', supportAgent_controller_1.SupportAgentController.createAgent);
    app.patch('/agents/:id', supportAgent_controller_1.SupportAgentController.updateAgent);
    app.delete('/agents/:id', supportAgent_controller_1.SupportAgentController.deleteAgent);
}
//# sourceMappingURL=adminSupport.js.map