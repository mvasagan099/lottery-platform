/**
 * MegaDraw Platform - Fastify Backend Server
 * Production-ready lottery platform API
 */

import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// Route imports
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import walletRoutes from './routes/wallet'
import gameRoutes from './routes/games'
import ticketRoutes from './routes/tickets'
import drawRoutes from './routes/draws'
import adminRoutes from './routes/admin'
import affiliateRoutes from './routes/affiliates'
import notificationRoutes from './routes/notifications'
import supportRoutes from './routes/support'
import publicCmsRoutes from './routes/publicCms'
import reportRoutes from './routes/reports'
import paymentRoutes from './routes/payments'
import settingsRoutes from './routes/settings'
import rbacRoutes from './routes/rbac'

import { initCronJobs } from './jobs/cron'

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Initialize Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

// Build Fastify app
async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true }
      } : undefined,
    },
    trustProxy: true,
  })

  // ── Security plugins ──────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })

  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  })

  await app.register(rateLimit, {
    global: true,
    max: process.env.NODE_ENV !== 'production' ? 10000 : 100,
    timeWindow: '1 minute',
    redis,
    skipOnError: false,
    keyGenerator: (req) => req.ip,
  })

  // ── JWT ───────────────────────────────────────────────
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback_secret_must_be_32_chars!',
    sign: { expiresIn: '15m' },
  })

  // ── File upload ───────────────────────────────────────
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  })

  // ── WebSockets ────────────────────────────────────────
  await app.register(websocket)

  // ── API Documentation ────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'MegaDraw API',
        description: 'Production-ready global Lottery Platform API',
        version: '1.0.0',
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'games', description: 'Lottery games' },
        { name: 'tickets', description: 'Ticket management' },
        { name: 'wallet', description: 'Wallet & transactions' },
        { name: 'admin', description: 'Administration' },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })

  // ── Decorate with shared clients ──────────────────────
  app.decorate('prisma', prisma)
  app.decorate('redis', redis)

  // ── Health check ──────────────────────────────────────
  app.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      await redis.ping()
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (err) {
      return { status: 'degraded', error: String(err) }
    }
  })

  // ── Routes ────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(userRoutes, { prefix: '/users' })
  await app.register(walletRoutes, { prefix: '/wallet' })
  await app.register(gameRoutes, { prefix: '/games' })
  await app.register(ticketRoutes, { prefix: '/tickets' })
  await app.register(drawRoutes, { prefix: '/draws' })
  await app.register(adminRoutes, { prefix: '/admin' })
  await app.register(affiliateRoutes, { prefix: '/affiliates' })
  await app.register(notificationRoutes, { prefix: '/notifications' })
  await app.register(supportRoutes, { prefix: '/support' })
  await app.register(publicCmsRoutes, { prefix: '/cms' })
  await app.register(reportRoutes, { prefix: '/reports' })
  await app.register(paymentRoutes, { prefix: '/payments' })
  await app.register(settingsRoutes, { prefix: '/settings' })
  await app.register(rbacRoutes, { prefix: '/rbac' })

  // ── Global error handler ──────────────────────────────
  app.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error, url: request.url, method: request.method })

    if (error.validation || error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        details: error.validation || (error as any).issues,
      })
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: 'Too many requests. Please try again later.',
      })
    }

    const statusCode = error.statusCode || 500
    return reply.status(statusCode).send({
      success: false,
      error: statusCode === 500 ? 'Internal server error' : error.message,
    })
  })

  return app
}

// Start server
async function start() {
  const app = await buildApp()
  const port = Number(process.env.PORT) || 3001
  const host = process.env.HOST || '0.0.0.0'

  try {
    await redis.connect()
    await app.listen({ port, host })
    app.log.info(`🚀 Server running on http://${host}:${port}`)
    app.log.info(`📚 API docs: http://${host}:${port}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // ── Initialize Background Jobs ──────────────────────
  if (process.env.NODE_ENV !== 'test') {
    initCronJobs()
  }

  // Graceful shutdown
  const signals = ['SIGTERM', 'SIGINT']
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`)
      await app.close()
      await prisma.$disconnect()
      await redis.quit()
      process.exit(0)
    })
  })
}

start()
