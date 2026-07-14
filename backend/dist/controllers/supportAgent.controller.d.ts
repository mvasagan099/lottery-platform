import { FastifyRequest, FastifyReply } from 'fastify';
export declare class SupportAgentController {
    static createAgent(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    static updateAgent(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    static getAgent(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    static listAgents(request: FastifyRequest<{
        Querystring: any;
    }>, reply: FastifyReply): Promise<never>;
    static deleteAgent(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=supportAgent.controller.d.ts.map