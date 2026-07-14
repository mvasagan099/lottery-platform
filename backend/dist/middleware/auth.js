"use strict";
/**
 * Authentication & Authorization Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSupport = exports.requireAdmin = void 0;
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireActiveAccount = requireActiveAccount;
exports.requireVerifiedEmail = requireVerifiedEmail;
exports.auditLog = auditLog;
const server_1 = require("../server");
/** Verify JWT and attach user to request */
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
        // Verify session is still active
        const session = await server_1.prisma.session.findUnique({
            where: { id: request.user.sessionId },
            select: { isActive: true, expiresAt: true },
        });
        if (!session?.isActive || session.expiresAt < new Date()) {
            return reply.status(401).send({ success: false, error: 'Session expired' });
        }
        // Update last used
        await server_1.prisma.session.update({
            where: { id: request.user.sessionId },
            data: { lastUsedAt: new Date() },
        });
    }
    catch (err) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
}
/** Require specific roles */
function requireRole(...roles) {
    return async (request, reply) => {
        if (!roles.includes(request.user?.role)) {
            return reply.status(403).send({ success: false, error: 'Insufficient permissions' });
        }
    };
}
/** Admin only */
exports.requireAdmin = requireRole('SUPER_ADMIN', 'ADMIN');
/** Support or admin */
exports.requireSupport = requireRole('SUPER_ADMIN', 'ADMIN', 'SUPPORT');
/** Check if user account is active */
async function requireActiveAccount(request, reply) {
    const user = await server_1.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { status: true, emailVerified: true },
    });
    if (!user) {
        return reply.status(401).send({ success: false, error: 'User not found' });
    }
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        return reply.status(403).send({
            success: false,
            error: 'Your account has been suspended. Contact support.',
        });
    }
}
/** Require email verification for sensitive actions */
async function requireVerifiedEmail(request, reply) {
    const user = await server_1.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { emailVerified: true },
    });
    if (!user?.emailVerified) {
        return reply.status(403).send({
            success: false,
            error: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED',
        });
    }
}
/** Log audit trail */
async function auditLog(userId, action, resource, resourceId, oldValues, newValues, request) {
    await server_1.prisma.auditLog.create({
        data: {
            userId,
            action,
            resource,
            resourceId,
            oldValues: oldValues,
            newValues: newValues,
            ipAddress: request?.ip,
            userAgent: request?.headers['user-agent'],
        },
    });
}
//# sourceMappingURL=auth.js.map