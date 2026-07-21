"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = settingsRoutes;
const server_1 = require("../server");
async function settingsRoutes(app) {
    // GET /api/settings/:category
    // Public endpoint for general settings, protected for others
    app.get('/:category', async (request, reply) => {
        const { category } = request.params;
        try {
            const setting = await server_1.prisma.systemSetting.findUnique({
                where: { category },
            });
            // Default to empty object if not found
            return {
                success: true,
                data: setting?.data || {},
            };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to fetch settings' });
        }
    });
    // PUT /api/settings/:category
    // Protected endpoint to update settings
    app.put('/:category', {
        preValidation: async (request, reply) => {
            await request.jwtVerify();
            const user = request.user;
            if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
        }
    }, async (request, reply) => {
        const { category } = request.params;
        const data = request.body;
        const user = request.user;
        try {
            const setting = await server_1.prisma.systemSetting.upsert({
                where: { category },
                update: {
                    data: data,
                    updatedBy: user.id,
                },
                create: {
                    category,
                    data: data,
                    updatedBy: user.id,
                },
            });
            return {
                success: true,
                message: 'Settings updated successfully',
                data: setting.data,
            };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, message: 'Failed to update settings' });
        }
    });
}
//# sourceMappingURL=settings.js.map