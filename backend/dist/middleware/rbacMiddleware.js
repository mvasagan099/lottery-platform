"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const server_1 = require("../server");
function requirePermission(module, action) {
    return async (request, reply) => {
        try {
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ error: 'Unauthorized', message: 'Not logged in' });
            }
            // HIGH-04: Check SUPER_ADMIN FIRST — skip expensive DB query
            if (user.role === 'SUPER_ADMIN') {
                return; // Full bypass — no DB query needed
            }
            // Fetch the user's dynamic roles and their associated permissions
            const userMappings = await server_1.prisma.userRoleMapping.findMany({
                where: { userId: user.userId },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            });
            // Flatten all permissions granted to this user across all their assigned roles
            const hasAccess = userMappings.some(mapping => mapping.role.isActive &&
                mapping.role.permissions.some(rp => rp.permission.module === module && rp.permission.action === action));
            if (!hasAccess) {
                // HIGH-04: Use user.userId (not user.id) for accurate audit logs
                request.log.warn(`RBAC Denied: User ${user.userId} attempted ${action} on ${module}`);
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: `You lack the required permission: ${module}:${action}`
                });
            }
            // Access Granted — proceed to route handler
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    };
}
//# sourceMappingURL=rbacMiddleware.js.map