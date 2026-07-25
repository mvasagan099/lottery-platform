import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { authenticate, auditLog } from '../middleware/auth'

// HIGH-11: Safe URL validator for KYC documents
const safeHttpsUrl = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') return false
      const host = parsed.hostname
      // Block internal/private IPs
      if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|localhost)/i.test(host)) return false
      return true
    } catch { return false }
  },
  { message: 'URL must be a secure HTTPS URL pointing to an external host' }
)

const kycSchema = z.object({
  documentType: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'UTILITY_BILL']),
  documentUrl: safeHttpsUrl,
  selfieUrl: safeHttpsUrl,
})

// HIGH-02: Whitelist notification preference fields
const notifPrefsSchema = z.object({
  emailDeposits: z.boolean().optional(),
  emailWithdrawals: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  emailNewsletters: z.boolean().optional(),
  pushDeposits: z.boolean().optional(),
  pushWithdrawals: z.boolean().optional(),
  pushPromotions: z.boolean().optional(),
  smsDeposits: z.boolean().optional(),
  smsWithdrawals: z.boolean().optional(),
  smsPromotions: z.boolean().optional(),
})

export default async function userRoutes(app: FastifyInstance) {

  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        dateOfBirth: true, phone: true, role: true, status: true,
        emailVerified: true, twoFactorEnabled: true, kycStatus: true,
        referralCode: true, country: true, state: true, city: true,
        address: true, postcode: true, createdAt: true, lastLoginAt: true,
        wallet: { select: { balance: true, bonusBalance: true, pendingBalance: true } },
        notificationPrefs: true,
        roles: { 
          include: { 
            role: { 
              include: { 
                permissions: { include: { permission: true } } 
              } 
            } 
          } 
        },
      },
    })
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: user })
  })

  app.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const { firstName, lastName, phone, country, state, city, address, postcode, dateOfBirth } =
      request.body as any

    const updateData: any = { firstName, lastName, phone, country, state, city, address, postcode }
    if (dateOfBirth) {
      updateData.dateOfBirth = new Date(dateOfBirth)
    }

    const user = await prisma.user.update({
      where: { id: request.user.userId },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, country: true, state: true, city: true, address: true, postcode: true,
        dateOfBirth: true,
      },
    })

    await auditLog(request.user.userId, 'PROFILE_UPDATED', 'User', request.user.userId, undefined, undefined, request)
    return reply.send({ success: true, data: user })
  })

  app.patch('/me/notifications', { preHandler: authenticate }, async (request, reply) => {
    const validated = notifPrefsSchema.partial().parse(request.body)
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: request.user.userId },
      update: validated as any,
      create: { userId: request.user.userId, ...(validated as any) },
    })
    return reply.send({ success: true, data: prefs })
  })

  app.get('/me/devices', { preHandler: authenticate }, async (request, reply) => {
    const devices = await prisma.deviceHistory.findMany({
      where: { userId: request.user.userId },
      orderBy: { lastSeenAt: 'desc' },
    })
    return reply.send({ success: true, data: devices })
  })

  // Submit KYC document — HIGH-11: validates URL safety
  app.post('/me/kyc', { preHandler: authenticate }, async (request, reply) => {
    const { documentType, documentUrl, selfieUrl } = kycSchema.parse(request.body)

    await prisma.kYCRecord.create({
      data: {
        userId: request.user.userId,
        documentType,
        documentUrl,
        selfieUrl,
        status: 'PENDING',
      },
    })

    await prisma.user.update({
      where: { id: request.user.userId },
      data: { kycStatus: 'PENDING' },
    })

    return reply.status(201).send({ success: true, message: 'KYC documents submitted for review' })
  })

  app.get('/me/referrals', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        referralCode: true,
        referrals: {
          select: {
            id: true, email: true, firstName: true, createdAt: true,
            wallet: { select: { totalDeposited: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    return reply.send({ success: true, data: user })
  })
}
