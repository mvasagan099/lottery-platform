"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const publicCmsRoutes = async (app) => {
    // Public Endpoint to fetch active banners
    app.get('/banners', async (request, reply) => {
        const { position } = request.query;
        const where = {
            isActive: true,
            OR: [
                { endDate: null },
                { endDate: { gt: new Date() } }
            ]
        };
        if (position) {
            where.position = position;
        }
        const banners = await prisma.banner.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
        });
        return reply.send({ success: true, data: banners });
    });
    // Public Endpoint to fetch active pages
    app.get('/pages/:slug', async (request, reply) => {
        const { slug } = request.params;
        const page = await prisma.cmsPage.findFirst({
            where: { slug, isActive: true }
        });
        if (!page) {
            return reply.status(404).send({ success: false, error: 'Page not found' });
        }
        return reply.send({ success: true, data: page });
    });
    // Public Endpoint to fetch active settings
    app.get('/settings', async (request, reply) => {
        const settings = await prisma.setting.findMany();
        return reply.send({ success: true, data: settings });
    });
};
exports.default = publicCmsRoutes;
//# sourceMappingURL=publicCms.js.map