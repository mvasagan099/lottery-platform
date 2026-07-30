import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

// HIGH-04 FIX: Only these categories may be read publicly (no auth required).
// Any other category key returns 403 regardless of auth status, preventing
// accidental exposure if an admin ever stores sensitive config in the settings store.
const PUBLIC_CATEGORIES = new Set(['general', 'lottery', 'wallet', 'payments'])

export default async function settingsRoutes(app: FastifyInstance) {
  
  // GET /api/settings/:category
  // Public endpoint for general settings, protected for others
  app.get<{ Params: { category: string } }>(
    '/:category',
    async (request, reply) => {
      const { category } = request.params;

      // HIGH-04: Enforce allow-list — return 403 for any non-public category.
      if (!PUBLIC_CATEGORIES.has(category)) {
        return reply.status(403).send({ success: false, message: 'Forbidden' })
      }

      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { category },
        });

        // Default to empty object if not found
        return {
          success: true,
          data: setting?.data || {},
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to fetch settings' });
      }
    }
  );

  // PUT /api/settings/:category
  // Protected endpoint to update settings
  app.put<{ Params: { category: string }; Body: any }>(
    '/:category',
    {
      preValidation: async (request, reply) => {
        await request.jwtVerify();
        const user = request.user as any;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
          return reply.status(403).send({ success: false, message: 'Forbidden' });
        }
      }
    },
    async (request, reply) => {
      const { category } = request.params;
      const data = request.body;
      const user = request.user as any;

      try {
        const setting = await prisma.systemSetting.upsert({
          where: { category },
          update: {
            data: data as any,
            updatedBy: user.id,
          },
          create: {
            category,
            data: data as any,
            updatedBy: user.id,
          },
        });

        return {
          success: true,
          message: 'Settings updated successfully',
          data: setting.data,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to update settings' });
      }
    }
  );
}
