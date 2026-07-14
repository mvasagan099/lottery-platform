import { FastifyRequest } from 'fastify';
export declare const connectedClients: Map<string, any>;
export declare class LiveChatController {
    static handleConnection(connection: any, request: FastifyRequest): void;
    static broadcastToUser(userId: string, data: any): void;
}
//# sourceMappingURL=liveChat.controller.d.ts.map