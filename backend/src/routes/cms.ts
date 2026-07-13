/**
 * CMS Routes
 * - Pages, banners, promotions management
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate, requireAdmin } from '../middleware/auth'

export default async function cmsRoutes(app: FastifyInstance) {

  // GET /cms/pages/:slug - Get a CMS page
  app.get('/pages/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const page = await prisma.cmsPage.findUnique({
      where: { slug, isActive: true },
    })

    if (!page) {
      return reply.status(404).send({ success: false, error: 'Page not found' })
    }

    return reply.send({ success: true, data: page })
  })

  // GET /cms/pages - List all pages (admin)
  app.get('/pages', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const pages = await prisma.cmsPage.findMany({
      orderBy: { slug: 'asc' },
    })
    return reply.send({ success: true, data: pages })
  })

  // POST /cms/pages - Create page (admin)
  app.post('/pages', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { slug, title, content, metaTitle, metaDesc } = request.body as any

    const page = await prisma.cmsPage.create({
      data: { slug, title, content, metaTitle, metaDesc },
    })

    return reply.status(201).send({ success: true, data: page })
  })

  // PUT /cms/pages/:slug - Update page (admin)
  app.put('/pages/:slug', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const data = request.body as any

    const page = await prisma.cmsPage.update({ where: { slug }, data })
    return reply.send({ success: true, data: page })
  })

  // DELETE /cms/pages/:slug - Delete page (admin)
  app.delete('/pages/:slug', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    await prisma.cmsPage.delete({ where: { slug } })
    return reply.send({ success: true })
  })

  // ── Banners ───────────────────────────────────────────────────────────────

  // GET /cms/banners - Get active banners
  app.get('/banners', async (request, reply) => {
    const { position } = request.query as { position?: string }
    const now = new Date()

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        ...(position && { position }),
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })

    return reply.send({ success: true, data: banners })
  })

  // GET /cms/banners/all - All banners for admin
  app.get('/banners/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    return reply.send({ success: true, data: banners })
  })

  // POST /cms/banners - Create banner (admin)
  app.post('/banners', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const data = request.body as any
    const banner = await prisma.banner.create({ data })
    return reply.status(201).send({ success: true, data: banner })
  })

  // PUT /cms/banners/:id - Update banner (admin)
  app.put('/banners/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const banner = await prisma.banner.update({ where: { id }, data })
    return reply.send({ success: true, data: banner })
  })

  // DELETE /cms/banners/:id - Delete banner (admin)
  app.delete('/banners/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.banner.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // ── Promotions ─────────────────────────────────────────────────────────────

  // GET /cms/promotions - Active promotions
  app.get('/promotions', async (request, reply) => {
    const now = new Date()

    const promos = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { startDate: 'desc' }],
    })

    return reply.send({ success: true, data: promos })
  })

  // GET /cms/promotions/all - Admin: all promotions
  app.get('/promotions/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const promos = await prisma.promotion.findMany({ orderBy: { startDate: 'desc' } })
    return reply.send({ success: true, data: promos })
  })

  // POST /cms/promotions - Create promotion (admin)
  app.post('/promotions', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const data = request.body as any
    const promo = await prisma.promotion.create({ data })
    return reply.status(201).send({ success: true, data: promo })
  })

  // PUT /cms/promotions/:id - Update promotion (admin)
  app.put('/promotions/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const promo = await prisma.promotion.update({ where: { id }, data })
    return reply.send({ success: true, data: promo })
  })

  // DELETE /cms/promotions/:id - Delete promotion (admin)
  app.delete('/promotions/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.promotion.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // ── Settings (public read, admin write) ────────────────────────────────────

  // GET /cms/settings - Public settings
  app.get('/settings', async (request, reply) => {
    const settings = await prisma.setting.findMany({
      where: { isPublic: true },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return reply.send({ success: true, data: map })
  })

  // GET /cms/settings/all - All settings (admin)
  app.get('/settings/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const settings = await prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
    return reply.send({ success: true, data: settings })
  })

  // PUT /cms/settings/:key - Update setting (admin)
  app.put('/settings/:key', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { key } = request.params as { key: string }
    const { value } = request.body as { value: string }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return reply.send({ success: true, data: setting })
  })
}
