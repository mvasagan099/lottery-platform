/**
 * Notification Routes
 * - In-app notifications, preferences
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate } from '../middleware/auth'

const prefsSchema = z.object({
  emailDeposit: z.boolean().optional(),
  emailWithdrawal: z.boolean().optional(),
  emailTicket: z.boolean().optional(),
  emailDraw: z.boolean().optional(),
  emailWinning: z.boolean().optional(),
  emailPromo: z.boolean().optional(),
  inAppDeposit: z.boolean().optional(),
  inAppWithdrawal: z.boolean().optional(),
  inAppTicket: z.boolean().optional(),
  inAppDraw: z.boolean().optional(),
  inAppWinning: z.boolean().optional(),
  inAppPromo: z.boolean().optional(),
})

export default async function notificationRoutes(app: FastifyInstance) {

  // GET /notifications - List user's notifications
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { page = '1', limit = '20', unread } = request.query as Record<string, string>
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { userId: request.user.userId }
    if (unread === 'true') where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: request.user.userId, isRead: false },
      }),
    ])

    return reply.send({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  })

  // PATCH /notifications/:id/read - Mark as read
  app.patch('/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.notification.updateMany({
      where: { id, userId: request.user.userId },
      data: { isRead: true, readAt: new Date() },
    })

    return reply.send({ success: true })
  })

  // POST /notifications/read-all - Mark all as read
  app.post('/read-all', { preHandler: authenticate }, async (request, reply) => {
    await prisma.notification.updateMany({
      where: { userId: request.user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return reply.send({ success: true, message: 'All notifications marked as read' })
  })

  // DELETE /notifications/:id - Delete notification
  app.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.notification.deleteMany({
      where: { id, userId: request.user.userId },
    })

    return reply.send({ success: true })
  })

  // GET /notifications/preferences - Get notification preferences
  app.get('/preferences', { preHandler: authenticate }, async (request, reply) => {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: request.user.userId },
    })

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: request.user.userId },
      })
    }

    return reply.send({ success: true, data: prefs })
  })

  // PATCH /notifications/preferences - Update preferences
  app.patch('/preferences', { preHandler: authenticate }, async (request, reply) => {
    const body = prefsSchema.parse(request.body)

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: request.user.userId },
      update: body,
      create: { userId: request.user.userId, ...body },
    })

    return reply.send({ success: true, data: prefs })
  })

  // GET /notifications/unread-count - Quick unread count
  app.get('/unread-count', { preHandler: authenticate }, async (request, reply) => {
    const count = await prisma.notification.count({
      where: { userId: request.user.userId, isRead: false },
    })

    return reply.send({ success: true, data: { count } })
  })
}
