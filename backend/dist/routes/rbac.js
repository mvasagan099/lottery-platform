"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rbacRoutes;
const server_1 = require("../server");
const crypto_1 = __importDefault(require("crypto"));
async function rbacRoutes(app) {
    // ── Roles ─────────────────────────────────────────────────────────────
    // Get all roles with their assigned users count and permission count
    app.get('/', async (request, reply) => {
        try {
            const roles = await server_1.prisma.role.findMany({
                include: {
                    _count: {
                        select: { users: true, permissions: true },
                    },
                },
                orderBy: { priority: 'desc' },
            });
            return { success: true, data: roles };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch roles' });
        }
    });
    // Get single role details
    app.get('/:id', async (request, reply) => {
        try {
            const role = await server_1.prisma.role.findUnique({
                where: { id: request.params.id },
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                    users: {
                        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
                    },
                },
            });
            if (!role) {
                return reply.status(404).send({ success: false, message: 'Role not found' });
            }
            return { success: true, data: role };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch role' });
        }
    });
    // Create new role
    app.post('/', async (request, reply) => {
        try {
            const { name, description, department, priority } = request.body;
            const role = await server_1.prisma.role.create({
                data: { name, description, department, priority: priority || 0 },
            });
            return { success: true, message: 'Role created', data: role };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to create role' });
        }
    });
    // Update role
    app.patch('/:id', async (request, reply) => {
        try {
            const { name, description, department, priority } = request.body;
            const role = await server_1.prisma.role.update({
                where: { id: request.params.id },
                data: { name, description, department, priority },
            });
            return { success: true, message: 'Role updated', data: role };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to update role' });
        }
    });
    // Clone role
    app.post('/:id/clone', async (request, reply) => {
        try {
            const sourceRole = await server_1.prisma.role.findUnique({
                where: { id: request.params.id },
                include: { permissions: true }
            });
            if (!sourceRole) {
                return reply.status(404).send({ success: false, message: 'Source role not found' });
            }
            const clonedRole = await server_1.prisma.role.create({
                data: {
                    name: `${sourceRole.name} (Copy)`,
                    description: sourceRole.description,
                    department: sourceRole.department,
                    priority: sourceRole.priority,
                    permissions: {
                        create: sourceRole.permissions.map(p => ({
                            permissionId: p.permissionId
                        }))
                    }
                }
            });
            return { success: true, message: 'Role cloned successfully', data: clonedRole };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to clone role' });
        }
    });
    // ── Permissions ───────────────────────────────────────────────────────
    // Get all available system permissions (Matrix)
    app.get('/permissions', async (request, reply) => {
        try {
            const permissions = await server_1.prisma.permission.findMany({
                orderBy: [{ module: 'asc' }, { action: 'asc' }],
            });
            return { success: true, data: permissions };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch permissions' });
        }
    });
    // Bulk update permissions for a role
    app.post('/:id/permissions', async (request, reply) => {
        try {
            const { id } = request.params;
            const { permissionIds } = request.body;
            // Transaction to delete old and create new
            await server_1.prisma.$transaction([
                server_1.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
                server_1.prisma.rolePermission.createMany({
                    data: permissionIds.map(permId => ({
                        id: crypto_1.default.randomUUID(),
                        roleId: id,
                        permissionId: permId,
                    })),
                }),
            ]);
            return { success: true, message: 'Permissions updated successfully' };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to update permissions' });
        }
    });
    // ── User Assignment ───────────────────────────────────────────────────
    // Assign a role to a user
    app.post('/users/:id/roles', async (request, reply) => {
        try {
            const { id: userId } = request.params;
            const { roleId, expiresAt } = request.body;
            const assignment = await server_1.prisma.userRoleMapping.upsert({
                where: {
                    userId_roleId: { userId, roleId }
                },
                update: {
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                },
                create: {
                    userId,
                    roleId,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                }
            });
            return { success: true, message: 'Role assigned successfully', data: assignment };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to assign role' });
        }
    });
    // Unassign a role from a user
    app.delete('/users/:id/roles/:roleId', async (request, reply) => {
        try {
            const { id: userId, roleId } = request.params;
            await server_1.prisma.userRoleMapping.delete({
                where: {
                    userId_roleId: { userId, roleId }
                }
            });
            return { success: true, message: 'Role removed successfully' };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to remove role' });
        }
    });
}
//# sourceMappingURL=rbac.js.map