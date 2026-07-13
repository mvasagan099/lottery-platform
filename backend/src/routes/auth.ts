/**
 * Authentication Routes
 * - Register, Login, Logout, Refresh Token
 * - Email Verification, Password Reset
 * - Two-Factor Authentication
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import argon2 from 'argon2'
import { randomBytes } from 'crypto'
import * as otplib from 'otplib'
import { prisma, redis } from '../server'
import { authenticate, auditLog } from '../middleware/auth'
import { sendEmail } from '../services/email'
import { generateQR } from '../utils/qr'

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  referralCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string(),
  totp: z.string().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
})

const verifyEmailSchema = z.object({
  token: z.string(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
})

// ── Route handlers ────────────────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  app.post('/register', {
    config: { rateLimit: { max: 50, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = registerSchema.parse(request.body)

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    })

    if (existing) {
      const field = existing.email === body.email ? 'email' : 'username'
      return reply.status(409).send({
        success: false,
        error: `An account with this ${field} already exists`,
      })
    }

    // Validate age (18+)
    if (body.dateOfBirth) {
      const dob = new Date(body.dateOfBirth)
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (age < 18) {
        return reply.status(400).send({
          success: false,
          error: 'You must be 18 or older to register',
        })
      }
    }

    // Find referrer
    let referrerId: string | undefined
    if (body.referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: body.referralCode },
      })
      referrerId = referrer?.id
    }

    // Hash password
    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    // Create user with wallet
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: body.email,
          username: body.username,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          referredById: referrerId,
        },
      })

      // Create wallet
      await tx.wallet.create({ data: { userId: newUser.id } })

      // Create notification preferences
      await tx.notificationPreference.create({ data: { userId: newUser.id } })

      return newUser
    })

    // Send verification email
    const verifyToken = randomBytes(32).toString('hex')
    await redis.setex(`email_verify:${verifyToken}`, 86400, user.id) // 24h TTL

    await sendEmail({
      to: user.email,
      subject: 'Verify your MegaDraw account',
      template: 'email-verification',
      data: {
        name: user.firstName,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`,
      },
    })

    await auditLog(user.id, 'REGISTER', 'User', user.id, undefined, { email: user.email }, request)

    return reply.status(201).send({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    })
  })

  // POST /auth/resend-verification
  app.post('/resend-verification', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.userId } })
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    if (user.emailVerified) return reply.status(400).send({ success: false, error: 'Email is already verified' })

    const verifyToken = randomBytes(32).toString('hex')
    await redis.setex(`email_verify:${verifyToken}`, 86400, user.id) // 24h TTL

    await sendEmail({
      to: user.email,
      subject: 'Verify your MegaDraw account',
      template: 'email-verification',
      data: {
        name: user.firstName,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`,
      },
    })

    return reply.send({ success: true, message: 'Verification email resent' })
  })

  // POST /auth/login
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { wallet: { select: { balance: true, bonusBalance: true } } },
    })

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Incorrect email or password' })
    }

    // Check password
    const validPassword = await argon2.verify(user.passwordHash, body.password)
    if (!validPassword) {
      await auditLog(user.id, 'LOGIN_FAILED', 'User', user.id, undefined, undefined, request)
      return reply.status(401).send({ success: false, error: 'Incorrect email or password' })
    }

    // Check account status
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return reply.status(403).send({
        success: false,
        error: 'Account suspended. Please contact support.',
      })
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!body.totp) {
        return reply.status(200).send({
          success: false,
          requiresTOTP: true,
          message: 'Please enter your authenticator code',
        })
      }

      const valid = otplib.authenticator.verify({
        token: body.totp,
        secret: user.twoFactorSecret!,
      })

      if (!valid) {
        return reply.status(401).send({ success: false, error: 'Invalid authenticator code' })
      }
    }

    // Create session
    const sessionId = randomBytes(16).toString('hex')
    const accessToken = app.jwt.sign({
      userId: user.id,
      role: user.role,
      sessionId,
    })
    const refreshToken = randomBytes(64).toString('hex')

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: request.ip },
    })

    // Record device history
    await prisma.deviceHistory.upsert({
      where: { id: `${user.id}-${request.ip}`.substring(0, 25) },
      update: { lastSeenAt: new Date() },
      create: {
        userId: user.id,
        deviceName: parseDeviceName(request.headers['user-agent']),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || '',
        lastSeenAt: new Date(),
      },
    })

    await auditLog(user.id, 'LOGIN', 'User', user.id, undefined, undefined, request)

    return reply.send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          kycStatus: user.kycStatus,
          wallet: user.wallet,
        },
      },
    })
  })

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }

    if (!refreshToken) {
      return reply.status(401).send({ success: false, error: 'Refresh token required' })
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { select: { id: true, role: true, status: true } } },
    })

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return reply.status(401).send({ success: false, error: 'Invalid or expired refresh token' })
    }

    if (session.user.status === 'BANNED' || session.user.status === 'SUSPENDED') {
      return reply.status(403).send({ success: false, error: 'Account suspended' })
    }

    const newAccessToken = app.jwt.sign({
      userId: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    })

    await prisma.session.update({
      where: { id: session.id },
      data: { token: newAccessToken, lastUsedAt: new Date() },
    })

    return reply.send({ success: true, data: { accessToken: newAccessToken } })
  })

  // POST /auth/logout
  app.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    await prisma.session.update({
      where: { id: request.user.sessionId },
      data: { isActive: false },
    })

    return reply.send({ success: true, message: 'Logged out successfully' })
  })

  // POST /auth/verify-email
  app.post('/verify-email', async (request, reply) => {
    const { token } = verifyEmailSchema.parse(request.body)

    const userId = await redis.get(`email_verify:${token}`)
    if (!userId) {
      return reply.status(400).send({ success: false, error: 'Invalid or expired verification link' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    })

    await redis.del(`email_verify:${token}`)

    return reply.send({ success: true, message: 'Email verified successfully' })
  })

  // POST /auth/forgot-password
  app.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const { email } = forgotPasswordSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (user) {
      const resetToken = randomBytes(32).toString('hex')
      await redis.setex(`pwd_reset:${resetToken}`, 3600, user.id) // 1h TTL

      await sendEmail({
        to: user.email,
        subject: 'Reset your MegaDraw password',
        template: 'password-reset',
        data: {
          name: user.firstName,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        },
      })
    }

    return reply.send({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    })
  })

  // POST /auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    const { token, password } = resetPasswordSchema.parse(request.body)

    const userId = await redis.get(`pwd_reset:${token}`)
    if (!userId) {
      return reply.status(400).send({ success: false, error: 'Invalid or expired reset link' })
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    })

    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    })

    await redis.del(`pwd_reset:${token}`)
    await auditLog(userId, 'PASSWORD_RESET', 'User', userId, undefined, undefined, request)

    return reply.send({ success: true, message: 'Password reset successfully' })
  })

  // POST /auth/change-password
  app.post('/change-password', { preHandler: authenticate }, async (request, reply) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(request.body)
    const userId = request.user.userId

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })

    const valid = await argon2.verify(user.passwordHash, currentPassword)
    if (!valid) {
      return reply.status(401).send({ success: false, error: 'Current password is incorrect' })
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id })
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

    // Invalidate other sessions
    await prisma.session.updateMany({
      where: { userId, NOT: { id: request.user.sessionId } },
      data: { isActive: false },
    })

    await auditLog(userId, 'PASSWORD_CHANGED', 'User', userId, undefined, undefined, request)

    return reply.send({ success: true, message: 'Password changed successfully' })
  })

  // POST /auth/2fa/setup
  app.post('/2fa/setup', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    })

    if (user?.twoFactorEnabled) {
      return reply.status(400).send({ success: false, error: '2FA is already enabled' })
    }

    const secret = otplib.authenticator.generateSecret()
    const otpauth = otplib.authenticator.keyuri(user!.email, 'MegaDraw', secret)
    const qrCode = await generateQR(otpauth)

    // Store secret temporarily until confirmed
    await redis.setex(`2fa_setup:${userId}`, 600, secret) // 10min TTL

    return reply.send({
      success: true,
      data: { secret, qrCode },
    })
  })

  // POST /auth/2fa/confirm
  app.post('/2fa/confirm', { preHandler: authenticate }, async (request, reply) => {
    const { token } = request.body as { token: string }
    const userId = request.user.userId

    const secret = await redis.get(`2fa_setup:${userId}`)
    if (!secret) {
      return reply.status(400).send({ success: false, error: 'Setup session expired. Please restart.' })
    }

    const valid = otplib.authenticator.verify({ token, secret })
    if (!valid) {
      return reply.status(400).send({ success: false, error: 'Invalid code. Try again.' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorSecret: secret },
    })

    await redis.del(`2fa_setup:${userId}`)
    await auditLog(userId, '2FA_ENABLED', 'User', userId, undefined, undefined, request)

    return reply.send({ success: true, message: 'Two-factor authentication enabled' })
  })

  // DELETE /auth/2fa
  app.delete('/2fa', { preHandler: authenticate }, async (request, reply) => {
    const { password, token } = request.body as { password: string; token: string }
    const userId = request.user.userId

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })

    const validPwd = await argon2.verify(user.passwordHash, password)
    if (!validPwd) {
      return reply.status(401).send({ success: false, error: 'Invalid password' })
    }

    const validTOTP = otplib.authenticator.verify({
      token,
      secret: user.twoFactorSecret!,
    })

    if (!validTOTP) {
      return reply.status(401).send({ success: false, error: 'Invalid authenticator code' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    })

    await auditLog(userId, '2FA_DISABLED', 'User', userId, undefined, undefined, request)

    return reply.send({ success: true, message: 'Two-factor authentication disabled' })
  })

  // GET /auth/sessions
  app.get('/sessions', { preHandler: authenticate }, async (request, reply) => {
    const sessions = await prisma.session.findMany({
      where: { userId: request.user.userId, isActive: true },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    return reply.send({ success: true, data: sessions })
  })

  // DELETE /auth/sessions/:id
  app.delete('/sessions/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.session.updateMany({
      where: { id, userId: request.user.userId },
      data: { isActive: false },
    })

    return reply.send({ success: true, message: 'Session terminated' })
  })
}

function parseDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device'
  if (userAgent.includes('Mobile')) return 'Mobile Browser'
  if (userAgent.includes('iPad')) return 'iPad'
  if (userAgent.includes('Macintosh')) return 'Mac'
  if (userAgent.includes('Windows')) return 'Windows PC'
  if (userAgent.includes('Linux')) return 'Linux PC'
  return 'Browser'
}
