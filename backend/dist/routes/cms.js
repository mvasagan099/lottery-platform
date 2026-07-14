"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const cmsRoutes = async (app) => {
    // ── Pages Management ──────────────────────────────────────────────────────
    app.get('/pages', async (request, reply) => {
        const { page = '1', limit = '20', search, status } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status === 'PUBLISHED')
            where.isActive = true;
        if (status === 'DRAFT')
            where.isActive = false;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [pages, total] = await Promise.all([
            prisma.cmsPage.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { updatedAt: 'desc' }
            }),
            prisma.cmsPage.count({ where })
        ]);
        return reply.send({ success: true, data: pages, pagination: { page: Number(page), limit: Number(limit), total } });
    });
    app.post('/pages', async (request, reply) => {
        const { title, slug, content, metaTitle, metaDesc, isActive } = request.body;
        const existing = await prisma.cmsPage.findUnique({ where: { slug } });
        if (existing)
            return reply.status(400).send({ success: false, error: 'Slug already exists' });
        const cmsPage = await prisma.cmsPage.create({
            data: { title, slug, content, metaTitle, metaDesc, isActive }
        });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'PAGE_CREATE', 'CmsPage', cmsPage.id, undefined, { slug }, request);
        return reply.send({ success: true, data: cmsPage });
    });
    app.put('/pages/:id', async (request, reply) => {
        const { id } = request.params;
        const { title, slug, content, metaTitle, metaDesc, isActive } = request.body;
        const existing = await prisma.cmsPage.findUnique({ where: { slug } });
        if (existing && existing.id !== id)
            return reply.status(400).send({ success: false, error: 'Slug already exists on another page' });
        const cmsPage = await prisma.cmsPage.update({
            where: { id },
            data: { title, slug, content, metaTitle, metaDesc, isActive }
        });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'PAGE_UPDATE', 'CmsPage', id, undefined, { slug }, request);
        return reply.send({ success: true, data: cmsPage });
    });
    app.delete('/pages/:id', async (request, reply) => {
        const { id } = request.params;
        await prisma.cmsPage.delete({ where: { id } });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'PAGE_DELETE', 'CmsPage', id, undefined, undefined, request);
        return reply.send({ success: true, message: 'Page deleted' });
    });
    // ── Banner Management ─────────────────────────────────────────────────────
    app.get('/banners', async (request, reply) => {
        const { page = '1', limit = '20', search, position, status } = request.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (position)
            where.position = position;
        if (status === 'ACTIVE') {
            where.isActive = true;
            where.OR = [
                { endDate: null },
                { endDate: { gt: new Date() } }
            ];
        }
        if (status === 'EXPIRED') {
            where.endDate = { lte: new Date() };
        }
        if (status === 'DRAFT') {
            where.isActive = false;
        }
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }
        const [banners, total] = await Promise.all([
            prisma.banner.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
            }),
            prisma.banner.count({ where })
        ]);
        return reply.send({ success: true, data: banners, pagination: { page: Number(page), limit: Number(limit), total } });
    });
    app.post('/banners', async (request, reply) => {
        const data = request.body;
        if (data.startDate)
            data.startDate = new Date(data.startDate);
        if (data.endDate)
            data.endDate = new Date(data.endDate);
        const banner = await prisma.banner.create({ data });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'BANNER_CREATE', 'Banner', banner.id, undefined, { title: banner.title }, request);
        return reply.send({ success: true, data: banner });
    });
    app.put('/banners/:id', async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        if (data.startDate)
            data.startDate = new Date(data.startDate);
        if (data.endDate)
            data.endDate = new Date(data.endDate);
        const banner = await prisma.banner.update({ where: { id }, data });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'BANNER_UPDATE', 'Banner', id, undefined, { title: banner.title }, request);
        return reply.send({ success: true, data: banner });
    });
    app.delete('/banners/:id', async (request, reply) => {
        const { id } = request.params;
        await prisma.banner.delete({ where: { id } });
        await (0, auth_1.auditLog)(request.user?.userId || 'system', 'BANNER_DELETE', 'Banner', id, undefined, undefined, request);
        return reply.send({ success: true, message: 'Banner deleted' });
    });
    // ── Analytics (Mock) ──────────────────────────────────────────────────────
    app.get('/analytics', async (request, reply) => {
        const [totalPages, totalBanners, publishedPages] = await Promise.all([
            prisma.cmsPage.count(),
            prisma.banner.count(),
            prisma.cmsPage.count({ where: { isActive: true } })
        ]);
        const trafficSources = [
            { name: 'Organic Search', value: 45 },
            { name: 'Direct', value: 30 },
            { name: 'Social Media', value: 15 },
            { name: 'Referral', value: 10 }
        ];
        const pageViews = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                views: Math.floor(Math.random() * 5000) + 1000,
                conversions: Math.floor(Math.random() * 200) + 50
            };
        });
        return reply.send({
            success: true,
            data: {
                totalPages,
                publishedPages,
                totalBanners,
                draftPages: totalPages - publishedPages,
                trafficSources,
                pageViews,
                bannerClicks: 12450,
                averageCtr: 4.8
            }
        });
    });
};
exports.default = cmsRoutes;
//# sourceMappingURL=cms.js.map