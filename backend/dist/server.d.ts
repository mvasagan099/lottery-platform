/**
 * MegaDraw Platform - Fastify Backend Server
 * Production-ready lottery platform API
 */
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
export declare const prisma: PrismaClient<{
    log: ("query" | "warn" | "error")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const redis: Redis;
//# sourceMappingURL=server.d.ts.map