"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const server_1 = require("../server");
function requirePermission(module, action) {
    return async (request, reply) => {
        try {
            // 1. Verify user is authenticated (assuming request.user is set by auth middleware)
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ error: 'Unauthorized', message: 'Not logged in' });
            }
            // 2. Fetch the user's dynamic roles and their associated permissions
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
            // 3. Flatten all permissions granted to this user across all their assigned roles
            const hasAccess = userMappings.some(mapping => mapping.role.isActive &&
                mapping.role.permissions.some(rp => rp.permission.module === module && rp.permission.action === action));
            // 4. Super Admin Bypass (optional: if you want super admins to always bypass)
            if (user.role === 'SUPER_ADMIN') {
                return; // Allow access
            }
            // 5. Deny if no matching permission found
            if (!hasAccess) {
                request.log.warn(`RBAC Denied: User ${user.id} attempted ${action} on ${module}`);
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: `You lack the required permission: ${module}:${action}`
                });
            }
            // 6. Access Granted! Proceed to route handler.
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    };
}
//# sourceMappingURL=rbacMiddleware.js.map