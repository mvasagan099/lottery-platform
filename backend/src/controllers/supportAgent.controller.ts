import { FastifyRequest, FastifyReply } from 'fastify';
import { SupportAgentService } from '../services/supportAgent.service';
import { createAgentSchema, updateAgentSchema } from '../validators/support.validator';

export class SupportAgentController {
  static async createAgent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createAgentSchema.parse(request.body);
      const agent = await SupportAgentService.createAgent(data);
      return reply.status(201).send({ success: true, data: agent });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async updateAgent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = updateAgentSchema.parse(request.body);
      const agent = await SupportAgentService.updateAgent(request.params.id, data);
      return reply.send({ success: true, data: agent });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async getAgent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const agent = await SupportAgentService.getAgentById(request.params.id);
      if (!agent) {
        return reply.status(404).send({ success: false, error: 'Agent not found' });
      }
      return reply.send({ success: true, data: agent });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async listAgents(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    try {
      const agents = await SupportAgentService.listAgents(request.query);
      const formattedAgents = agents.map((agent: any) => ({
        ...agent,
        fullName: agent.user ? `${agent.user.firstName} ${agent.user.lastName}`.trim() : 'Unknown',
        username: agent.user?.email, // Fallback
      }));
      return reply.send({ success: true, data: formattedAgents });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }

  static async deleteAgent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await SupportAgentService.deleteAgent(request.params.id);
      return reply.send({ success: true, message: 'Agent deleted successfully' });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message || error });
    }
  }
}
