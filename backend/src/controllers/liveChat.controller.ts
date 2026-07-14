import { FastifyRequest, FastifyReply } from 'fastify';

// Track connected users
export const connectedClients = new Map<string, any>();

export class LiveChatController {
  static handleConnection(connection: any, request: FastifyRequest) {
    // Authenticate user via token from query param or header
    // In a real app we'd decode JWT here
    const token = (request.query as any).token;
    
    if (!token) {
      connection.socket.close(1008, 'Unauthorized');
      return;
    }

    // For demonstration, we assume token is the user ID
    // or we'd verify it: const decoded = app.jwt.verify(token);
    const userId = token; 

    connectedClients.set(userId, connection);

    connection.socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'TYPING') {
          // Broadcast typing to the agent/user
          const recipientId = data.ticketId; // We would look up assigned agent
          // For simplicity, we just log
        }
        
        if (data.type === 'MESSAGE') {
          // We could save message to DB here and broadcast it
          // Broadcast to recipient
        }
      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    connection.socket.on('close', () => {
      connectedClients.delete(userId);
    });
  }

  static broadcastToUser(userId: string, data: any) {
    const conn = connectedClients.get(userId);
    if (conn) {
      conn.socket.send(JSON.stringify(data));
    }
  }
}
