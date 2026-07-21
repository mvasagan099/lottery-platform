"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportAgentController = void 0;
const supportAgent_service_1 = require("../services/supportAgent.service");
const support_validator_1 = require("../validators/support.validator");
class SupportAgentController {
    static async createAgent(request, reply) {
        try {
            const data = support_validator_1.createAgentSchema.parse(request.body);
            const agent = await supportAgent_service_1.SupportAgentService.createAgent(data);
            return reply.status(201).send({ success: true, data: agent });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async updateAgent(request, reply) {
        try {
            const data = support_validator_1.updateAgentSchema.parse(request.body);
            const agent = await supportAgent_service_1.SupportAgentService.updateAgent(request.params.id, data);
            return reply.send({ success: true, data: agent });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async getAgent(request, reply) {
        try {
            const agent = await supportAgent_service_1.SupportAgentService.getAgentById(request.params.id);
            if (!agent) {
                return reply.status(404).send({ success: false, error: 'Agent not found' });
            }
            return reply.send({ success: true, data: agent });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async listAgents(request, reply) {
        try {
            const agents = await supportAgent_service_1.SupportAgentService.listAgents(request.query);
            const formattedAgents = agents.map((agent) => ({
                ...agent,
                fullName: agent.user ? `${agent.user.firstName} ${agent.user.lastName}`.trim() : 'Unknown',
                username: agent.user?.email, // Fallback
            }));
            return reply.send({ success: true, data: formattedAgents });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
    static async deleteAgent(request, reply) {
        try {
            await supportAgent_service_1.SupportAgentService.deleteAgent(request.params.id);
            return reply.send({ success: true, message: 'Agent deleted successfully' });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message || error });
        }
    }
}
exports.SupportAgentController = SupportAgentController;
//# sourceMappingURL=supportAgent.controller.js.map