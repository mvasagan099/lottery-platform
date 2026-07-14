/**
 * Authentication & Authorization Middleware
 */
import { FastifyRequest, FastifyReply } from 'fastify';
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            userId: string;
            role: string;
            sessionId: string;
        };
        user: {
            userId: string;
            role: string;
            sessionId: string;
        };
    }
}
/** Verify JWT and attach user to request */
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
/** Require specific roles */
export declare function requireRole(...roles: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/** Admin only */
export declare const requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/** Support or admin */
export declare const requireSupport: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/** Check if user account is active */
export declare function requireActiveAccount(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
/** Require email verification for sensitive actions */
export declare function requireVerifiedEmail(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
/** Log audit trail */
export declare function auditLog(userId: string, action: string, resource: string, resourceId?: string, oldValues?: object, newValues?: object, request?: FastifyRequest): Promise<void>;
//# sourceMappingURL=auth.d.ts.map