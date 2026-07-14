import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export default async function settingsRoutes(app: FastifyInstance) {
  
  // GET /api/settings/:category
  // Public endpoint for general settings, protected for others
  app.get<{ Params: { category: string } }>(
    '/:category',
    async (request, reply) => {
      const { category } = request.params;

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
