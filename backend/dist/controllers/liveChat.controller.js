"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChatController = exports.connectedClients = void 0;
// Track connected users
exports.connectedClients = new Map();
class LiveChatController {
    static handleConnection(connection, request) {
        // Authenticate user via token from query param or header
        // In a real app we'd decode JWT here
        const token = request.query.token;
        if (!token) {
            connection.socket.close(1008, 'Unauthorized');
            return;
        }
        // For demonstration, we assume token is the user ID
        // or we'd verify it: const decoded = app.jwt.verify(token);
        const userId = token;
        exports.connectedClients.set(userId, connection);
        connection.socket.on('message', (message) => {
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
            }
            catch (err) {
                console.error('Invalid message format', err);
            }
        });
        connection.socket.on('close', () => {
            exports.connectedClients.delete(userId);
        });
    }
    static broadcastToUser(userId, data) {
        const conn = exports.connectedClients.get(userId);
        if (conn) {
            conn.socket.send(JSON.stringify(data));
        }
    }
}
exports.LiveChatController = LiveChatController;
//# sourceMappingURL=liveChat.controller.js.map