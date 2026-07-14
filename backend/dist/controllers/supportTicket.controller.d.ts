import { FastifyRequest, FastifyReply } from 'fastify';
export declare class SupportTicketController {
    static createTicket(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    static getTicket(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    static updateTicket(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    static listTickets(request: FastifyRequest<{
        Querystring: any;
    }>, reply: FastifyReply): Promise<never>;
    static replyToTicket(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    static assignTicket(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=supportTicket.controller.d.ts.map