import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export default async function rbacRoutes(app: FastifyInstance) {
  
  // ── Roles ─────────────────────────────────────────────────────────────

  // Get all roles with their assigned users count and permission count
  app.get('/', async (request, reply) => {
    try {
      const roles = await prisma.role.findMany({
        include: {
          _count: {
            select: { users: true, permissions: true },
          },
        },
        orderBy: { priority: 'desc' },
      });
      return { success: true, data: roles };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Failed to fetch roles' });
    }
  });

  // Get single role details
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const role = await prisma.role.findUnique({
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
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Failed to fetch role' });
    }
  });

  // Create new role
  app.post<{ Body: { name: string; description?: string; department?: string; priority?: number } }>(
    '/',
    async (request, reply) => {
      try {
        const { name, description, department, priority } = request.body;
        const role = await prisma.role.create({
          data: { name, description, department, priority: priority || 0 },
        });
        return { success: true, message: 'Role created', data: role };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to create role' });
      }
    }
  );

  // Update role
  app.patch<{ Params: { id: string }, Body: { name?: string; description?: string; department?: string; priority?: number } }>(
    '/:id',
    async (request, reply) => {
      try {
        const { name, description, department, priority } = request.body;
        const role = await prisma.role.update({
          where: { id: request.params.id },
          data: { name, description, department, priority },
        });
        return { success: true, message: 'Role updated', data: role };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to update role' });
      }
    }
  );

  // Clone role
  app.post<{ Params: { id: string } }>(
    '/:id/clone',
    async (request, reply) => {
      try {
        const sourceRole = await prisma.role.findUnique({
          where: { id: request.params.id },
          include: { permissions: true }
        });
        if (!sourceRole) {
          return reply.status(404).send({ success: false, message: 'Source role not found' });
        }

        const clonedRole = await prisma.role.create({
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
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to clone role' });
      }
    }
  );

  // ── Permissions ───────────────────────────────────────────────────────

  // Get all available system permissions (Matrix)
  app.get('/permissions', async (request, reply) => {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      });
      return { success: true, data: permissions };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Failed to fetch permissions' });
    }
  });

  // Bulk update permissions for a role
  app.post<{ Params: { id: string }, Body: { permissionIds: string[] } }>(
    '/:id/permissions',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { permissionIds } = request.body;

        // Transaction to delete old and create new
        await prisma.$transaction([
          prisma.rolePermission.deleteMany({ where: { roleId: id } }),
          prisma.rolePermission.createMany({
            data: permissionIds.map(permId => ({
              roleId: id,
              permissionId: permId,
            })),
          }),
        ]);

        return { success: true, message: 'Permissions updated successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to update permissions' });
      }
    }
  );

  // ── User Assignment ───────────────────────────────────────────────────

  // Assign a role to a user
  app.post<{ Params: { id: string }, Body: { roleId: string; expiresAt?: string } }>(
    '/users/:id/roles',
    async (request, reply) => {
      try {
        const { id: userId } = request.params;
        const { roleId, expiresAt } = request.body;

        const assignment = await prisma.userRoleMapping.upsert({
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
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to assign role' });
      }
    }
  );

  // Unassign a role from a user
  app.delete<{ Params: { id: string, roleId: string } }>(
    '/users/:id/roles/:roleId',
    async (request, reply) => {
      try {
        const { id: userId, roleId } = request.params;

        await prisma.userRoleMapping.delete({
          where: {
            userId_roleId: { userId, roleId }
          }
        });

        return { success: true, message: 'Role removed successfully' };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to remove role' });
      }
    }
  );

}
