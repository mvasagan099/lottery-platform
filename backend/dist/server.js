"use strict";
/**
 * MegaDraw Platform - Fastify Backend Server
 * Production-ready lottery platform API
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.prisma = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const games_1 = __importDefault(require("./routes/games"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const draws_1 = __importDefault(require("./routes/draws"));
const admin_1 = __importDefault(require("./routes/admin"));
const affiliates_1 = __importDefault(require("./routes/affiliates"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const support_1 = __importDefault(require("./routes/support"));
const publicCms_1 = __importDefault(require("./routes/publicCms"));
const reports_1 = __importDefault(require("./routes/reports"));
const payments_1 = __importDefault(require("./routes/payments"));
// Initialize Prisma
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Initialize Redis
exports.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
// Build Fastify app
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined,
        },
        trustProxy: true,
    });
    // ── Security plugins ──────────────────────────────────
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    });
    await app.register(cors_1.default, {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    });
    await app.register(rate_limit_1.default, {
        global: true,
        max: 100,
        timeWindow: '1 minute',
        redis: exports.redis,
        skipOnError: false,
        keyGenerator: (req) => req.ip,
    });
    // ── JWT ───────────────────────────────────────────────
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || 'fallback_secret_must_be_32_chars!',
        sign: { expiresIn: '15m' },
    });
    // ── File upload ───────────────────────────────────────
    await app.register(multipart_1.default, {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    });
    // ── WebSockets ────────────────────────────────────────
    await app.register(websocket_1.default);
    // ── API Documentation ────────────────────────────────
    await app.register(swagger_1.default, {
        openapi: {
            info: {
                title: 'MegaDraw API',
                description: 'Production-ready Australian Lottery Platform API',
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
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: { docExpansion: 'list' },
    });
    // ── Decorate with shared clients ──────────────────────
    app.decorate('prisma', exports.prisma);
    app.decorate('redis', exports.redis);
    // ── Health check ──────────────────────────────────────
    app.get('/health', async () => {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
            await exports.redis.ping();
            return { status: 'healthy', timestamp: new Date().toISOString() };
        }
        catch (err) {
            return { status: 'degraded', error: String(err) };
        }
    });
    // ── Routes ────────────────────────────────────────────
    await app.register(auth_1.default, { prefix: '/auth' });
    await app.register(users_1.default, { prefix: '/users' });
    await app.register(wallet_1.default, { prefix: '/wallet' });
    await app.register(games_1.default, { prefix: '/games' });
    await app.register(tickets_1.default, { prefix: '/tickets' });
    await app.register(draws_1.default, { prefix: '/draws' });
    await app.register(admin_1.default, { prefix: '/admin' });
    await app.register(affiliates_1.default, { prefix: '/affiliates' });
    await app.register(notifications_1.default, { prefix: '/notifications' });
    await app.register(support_1.default, { prefix: '/support' });
    await app.register(publicCms_1.default, { prefix: '/cms' });
    await app.register(reports_1.default, { prefix: '/reports' });
    await app.register(payments_1.default, { prefix: '/payments' });
    // ── Global error handler ──────────────────────────────
    app.setErrorHandler(async (error, request, reply) => {
        request.log.error({ err: error, url: request.url, method: request.method });
        if (error.validation || error.name === 'ZodError') {
            return reply.status(400).send({
                success: false,
                error: 'Validation Error',
                details: error.validation || error.issues,
            });
        }
        if (error.statusCode === 429) {
            return reply.status(429).send({
                success: false,
                error: 'Too many requests. Please try again later.',
            });
        }
        const statusCode = error.statusCode || 500;
        return reply.status(statusCode).send({
            success: false,
            error: statusCode === 500 ? 'Internal server error' : error.message,
        });
    });
    return app;
}
// Start server
async function start() {
    const app = await buildApp();
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    try {
        await exports.redis.connect();
        await app.listen({ port, host });
        app.log.info(`🚀 Server running on http://${host}:${port}`);
        app.log.info(`📚 API docs: http://${host}:${port}/docs`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            app.log.info(`Received ${signal}, shutting down gracefully...`);
            await app.close();
            await exports.prisma.$disconnect();
            await exports.redis.quit();
            process.exit(0);
        });
    });
}
start();
//# sourceMappingURL=server.js.map