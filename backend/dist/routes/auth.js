"use strict";
/**
 * Authentication Routes
 * - Register, Login, Logout, Refresh Token
 * - Email Verification, Password Reset
 * - Two-Factor Authentication
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
exports.default = authRoutes;
const zod_1 = require("zod");
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = require("crypto");
const otplib = __importStar(require("otplib"));
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const affiliate_1 = require("../services/affiliate");
const qr_1 = require("../utils/qr");
// ── Validation schemas ────────────────────────────────────────────────────────
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    password: zod_1.z.string().min(8).max(100),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    country: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    referralCode: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string(),
    totp: zod_1.z.string().optional(),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8).max(100),
});
const verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    token: zod_1.z.string().length(6),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8).max(100),
});
// ── Route handlers ────────────────────────────────────────────────────────────
async function authRoutes(app) {
    const devLimit = (max, timeWindow) => process.env.NODE_ENV !== 'production'
        ? { max: 10000, timeWindow: '1 minute' }
        : { max, timeWindow };
    // POST /auth/register
    app.post('/register', {
        config: { rateLimit: devLimit(50, '15 minutes') },
    }, async (request, reply) => {
        const body = registerSchema.parse(request.body);
        // Check for existing user
        const existing = await server_1.prisma.user.findFirst({
            where: { OR: [{ email: body.email }, { username: body.username }] },
        });
        if (existing) {
            const field = existing.email === body.email ? 'email' : 'username';
            return reply.status(409).send({
                success: false,
                error: `An account with this ${field} already exists`,
            });
        }
        // Validate age (18+)
        if (body.dateOfBirth) {
            const dob = new Date(body.dateOfBirth);
            const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
            if (age < 18) {
                return reply.status(400).send({
                    success: false,
                    error: 'You must be 18 or older to register',
                });
            }
        }
        // Store registration data in Redis (15 minutes TTL)
        await server_1.redis.setex(`pending_reg:${body.email}`, 900, JSON.stringify(body));
        // Send verification email
        const otp = (0, crypto_1.randomInt)(100000, 999999).toString();
        await server_1.redis.setex(`email_verify:${body.email}`, 300, otp); // 5m TTL
        console.log(`\n\n🔑 [TESTING] OTP CODE FOR ${body.email}: ${otp}\n\n`);
        let emailSent = true;
        try {
            await (0, email_1.sendEmail)({
                to: body.email,
                subject: 'Verify your MegaDraw account',
                template: 'email-otp',
                data: {
                    name: body.firstName || body.username || 'User',
                    action: 'account verification',
                    code: otp,
                },
            });
        }
        catch (emailErr) {
            emailSent = false;
            console.error('Verification email failed after retries:', emailErr);
        }
        return reply.status(201).send({
            success: true,
            message: emailSent
                ? 'OTP sent. Please check your email to verify your account.'
                : 'We had trouble sending the verification email. Please try resending the code.',
            data: {
                email: body.email,
                username: body.username,
            },
        });
    });
    // POST /auth/resend-verification
    app.post('/resend-verification', async (request, reply) => {
        const { email } = forgotPasswordSchema.parse(request.body);
        const user = await server_1.prisma.user.findUnique({ where: { email } });
        let isPending = false;
        let pendingName = '';
        if (!user) {
            const pendingData = await server_1.redis.get(`pending_reg:${email}`);
            if (!pendingData) {
                return reply.status(404).send({ success: false, error: 'User not found or registration expired' });
            }
            isPending = true;
            pendingName = JSON.parse(pendingData).firstName || JSON.parse(pendingData).username;
        }
        else if (user.emailVerified) {
            return reply.status(400).send({ success: false, error: 'Email is already verified' });
        }
        const otp = (0, crypto_1.randomInt)(100000, 999999).toString();
        await server_1.redis.setex(`email_verify:${email}`, 300, otp); // 5m TTL
        console.log(`\n\n🔑 [TESTING] RESENT OTP CODE FOR ${email}: ${otp}\n\n`);
        let emailSent = true;
        try {
            await (0, email_1.sendEmail)({
                to: email,
                subject: 'Verify your MegaDraw account',
                template: 'email-otp',
                data: {
                    name: (isPending ? pendingName : (user?.firstName || user?.username)) || 'User',
                    action: 'account verification',
                    code: otp,
                },
            });
        }
        catch (emailErr) {
            emailSent = false;
            console.error('Resend verification email failed after retries:', emailErr);
        }
        return reply.send({
            success: true,
            message: emailSent ? 'Verification email resent' : 'Failed to send email due to Resend tier limits, but OTP is in terminal logs.'
        });
    });
    // POST /auth/login
    app.post('/login', {
        config: { rateLimit: devLimit(10, '15 minutes') },
    }, async (request, reply) => {
        const body = loginSchema.parse(request.body);
        const user = await server_1.prisma.user.findUnique({
            where: { email: body.email },
            include: {
                wallet: { select: { balance: true, bonusBalance: true } },
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } }
                            }
                        }
                    }
                }
            },
        });
        if (!user) {
            return reply.status(401).send({ success: false, error: 'Incorrect email or password' });
        }
        // Check password
        const validPassword = await argon2_1.default.verify(user.passwordHash, body.password);
        if (!validPassword) {
            await (0, auth_1.auditLog)(user.id, 'LOGIN_FAILED', 'User', user.id, undefined, undefined, request);
            return reply.status(401).send({ success: false, error: 'Incorrect email or password' });
        }
        // Check account status
        if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
            return reply.status(403).send({
                success: false,
                error: 'Account suspended. Please contact support.',
            });
        }
        // Check 2FA
        if (user.twoFactorEnabled) {
            if (!body.totp) {
                return reply.status(200).send({
                    success: false,
                    requiresTOTP: true,
                    message: 'Please enter your verification code',
                });
            }
            let valid = false;
            const cachedOtp = await server_1.redis.get(`email_otp:${user.id}:login`);
            if (cachedOtp && cachedOtp === body.totp) {
                valid = true;
                await server_1.redis.del(`email_otp:${user.id}:login`);
            }
            if (!valid && user.twoFactorSecret) {
                try {
                    valid = otplib.authenticator.verify({
                        token: body.totp,
                        secret: user.twoFactorSecret,
                    });
                }
                catch (e) {
                    console.error('TOTP verify error:', e);
                }
            }
            if (!valid) {
                return reply.status(401).send({ success: false, error: 'Invalid verification code' });
            }
        }
        // Create session
        const sessionId = (0, crypto_1.randomBytes)(16).toString('hex');
        const accessToken = app.jwt.sign({
            userId: user.id,
            role: user.role,
            sessionId,
        });
        const refreshToken = (0, crypto_1.randomBytes)(64).toString('hex');
        await server_1.prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                token: accessToken,
                refreshToken,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
        // Update last login
        await server_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), lastLoginIp: request.ip },
        });
        // Record device history
        await server_1.prisma.deviceHistory.upsert({
            where: { id: `${user.id}-${request.ip}`.substring(0, 25) },
            update: { lastSeenAt: new Date() },
            create: {
                userId: user.id,
                deviceName: parseDeviceName(request.headers['user-agent']),
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'] || '',
                lastSeenAt: new Date(),
            },
        });
        await (0, auth_1.auditLog)(user.id, 'LOGIN', 'User', user.id, undefined, undefined, request);
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
                    roles: user.roles,
                },
            },
        });
    });
    // POST /auth/request-email-otp
    app.post('/request-email-otp', {
        config: { rateLimit: devLimit(3, '5 minutes') },
    }, async (request, reply) => {
        const body = loginSchema.parse(request.body);
        const user = await server_1.prisma.user.findUnique({ where: { email: body.email } });
        if (!user)
            return reply.status(401).send({ success: false, error: 'Incorrect email or password' });
        const validPassword = await argon2_1.default.verify(user.passwordHash, body.password);
        if (!validPassword)
            return reply.status(401).send({ success: false, error: 'Incorrect email or password' });
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        await server_1.redis.set(`email_otp:${user.id}:login`, code, 'EX', 300);
        console.log(`\n\n🔑 [TESTING] LOGIN OTP CODE FOR ${user.email}: ${code}\n\n`);
        try {
            await (0, email_1.sendEmail)({
                to: user.email,
                subject: 'MegaDraw Login Verification Code',
                template: 'email-otp',
                data: { name: user.firstName, action: 'login', code },
            });
        }
        catch (e) {
            console.error('Failed to send OTP:', e);
            return reply.status(500).send({ success: false, error: 'Failed to send verification email' });
        }
        return reply.send({ success: true, message: 'Verification code sent to email' });
    });
    // POST /auth/refresh
    app.post('/refresh', async (request, reply) => {
        const { refreshToken } = request.body;
        if (!refreshToken) {
            return reply.status(401).send({ success: false, error: 'Refresh token required' });
        }
        const session = await server_1.prisma.session.findUnique({
            where: { refreshToken },
            include: { user: { select: { id: true, role: true, status: true } } },
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return reply.status(401).send({ success: false, error: 'Invalid or expired refresh token' });
        }
        if (session.user.status === 'BANNED' || session.user.status === 'SUSPENDED') {
            return reply.status(403).send({ success: false, error: 'Account suspended' });
        }
        const newAccessToken = app.jwt.sign({
            userId: session.user.id,
            role: session.user.role,
            sessionId: session.id,
        });
        await server_1.prisma.session.update({
            where: { id: session.id },
            data: { token: newAccessToken, lastUsedAt: new Date() },
        });
        return reply.send({ success: true, data: { accessToken: newAccessToken } });
    });
    // POST /auth/logout
    app.post('/logout', { preHandler: auth_1.authenticate }, async (request, reply) => {
        await server_1.prisma.session.update({
            where: { id: request.user.sessionId },
            data: { isActive: false },
        });
        return reply.send({ success: true, message: 'Logged out successfully' });
    });
    // POST /auth/verify-email
    app.post('/verify-email', async (request, reply) => {
        const { email, token } = verifyEmailSchema.parse(request.body);
        const cachedOtp = await server_1.redis.get(`email_verify:${email}`);
        if (!cachedOtp || cachedOtp !== token) {
            return reply.status(400).send({ success: false, error: 'Invalid or expired verification code' });
        }
        const user = await server_1.prisma.user.findUnique({ where: { email } });
        if (user) {
            // User exists but unverified (old flow compatibility)
            await server_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    status: 'ACTIVE',
                },
            });
        }
        else {
            // Check pending registration
            const pendingDataStr = await server_1.redis.get(`pending_reg:${email}`);
            if (!pendingDataStr) {
                return reply.status(404).send({ success: false, error: 'User registration not found or expired. Please register again.' });
            }
            const body = JSON.parse(pendingDataStr);
            // Find referrer
            let referrerId;
            if (body.referralCode) {
                const referrer = await server_1.prisma.user.findFirst({
                    where: { referralCode: body.referralCode },
                });
                referrerId = referrer?.id;
            }
            // Hash password
            const passwordHash = await argon2_1.default.hash(body.password, {
                type: argon2_1.default.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 4,
            });
            // Create user with wallet
            const newUser = await server_1.prisma.$transaction(async (tx) => {
                const createdUser = await tx.user.create({
                    data: {
                        email: body.email,
                        username: body.username,
                        passwordHash,
                        firstName: body.firstName,
                        lastName: body.lastName,
                        country: body.country,
                        phone: body.phone,
                        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                        referredById: referrerId,
                        referralCode: Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join(''),
                        emailVerified: true,
                        emailVerifiedAt: new Date(),
                        status: 'ACTIVE',
                    },
                });
                await tx.wallet.create({ data: { userId: createdUser.id } });
                await tx.notificationPreference.create({ data: { userId: createdUser.id } });
                return createdUser;
            });
            // Trigger referral signup tracking
            (0, affiliate_1.processAffiliateCommission)({ referredUserId: newUser.id, type: 'SIGNUP' }).catch(console.error);
            await (0, auth_1.auditLog)(newUser.id, 'REGISTER', 'User', newUser.id, undefined, { email: newUser.email }, request);
            await server_1.redis.del(`pending_reg:${email}`);
        }
        await server_1.redis.del(`email_verify:${email}`);
        return reply.send({ success: true, message: 'Email verified successfully' });
    });
    // POST /auth/skip-verification
    app.post('/skip-verification', async (request, reply) => {
        const { email } = forgotPasswordSchema.parse(request.body);
        const pendingDataStr = await server_1.redis.get(`pending_reg:${email}`);
        if (!pendingDataStr) {
            return reply.status(404).send({ success: false, error: 'User registration not found or expired. Please register again.' });
        }
        const body = JSON.parse(pendingDataStr);
        // Find referrer
        let referrerId;
        if (body.referralCode) {
            const referrer = await server_1.prisma.user.findFirst({
                where: { referralCode: body.referralCode },
            });
            referrerId = referrer?.id;
        }
        // Hash password
        const passwordHash = await argon2_1.default.hash(body.password, {
            type: argon2_1.default.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        // Create user with wallet
        const newUser = await server_1.prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: body.email,
                    username: body.username,
                    passwordHash,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    country: body.country,
                    phone: body.phone,
                    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                    referredById: referrerId,
                    referralCode: Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join(''),
                    emailVerified: false,
                    status: 'PENDING_VERIFICATION',
                },
            });
            await tx.wallet.create({ data: { userId: createdUser.id } });
            await tx.notificationPreference.create({ data: { userId: createdUser.id } });
            return createdUser;
        });
        // Trigger referral signup tracking
        (0, affiliate_1.processAffiliateCommission)({ referredUserId: newUser.id, type: 'SIGNUP' }).catch(console.error);
        await (0, auth_1.auditLog)(newUser.id, 'REGISTER_SKIPPED_VERIFY', 'User', newUser.id, undefined, { email: newUser.email }, request);
        await server_1.redis.del(`pending_reg:${email}`);
        await server_1.redis.del(`email_verify:${email}`);
        return reply.send({ success: true, message: 'Account created. Email verification skipped.' });
    });
    // POST /auth/forgot-password
    app.post('/forgot-password', {
        config: { rateLimit: devLimit(3, '15 minutes') },
    }, async (request, reply) => {
        const { email } = forgotPasswordSchema.parse(request.body);
        const user = await server_1.prisma.user.findUnique({ where: { email } });
        // Always return success to prevent email enumeration
        if (user) {
            const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
            await server_1.redis.setex(`pwd_reset:${resetToken}`, 3600, user.id); // 1h TTL
            await (0, email_1.sendEmail)({
                to: user.email,
                subject: 'Reset your MegaDraw password',
                template: 'password-reset',
                data: {
                    name: user.firstName,
                    resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                },
            });
        }
        return reply.send({
            success: true,
            message: 'If an account exists with this email, a reset link has been sent.',
        });
    });
    // POST /auth/reset-password
    app.post('/reset-password', async (request, reply) => {
        const { token, password } = resetPasswordSchema.parse(request.body);
        const userId = await server_1.redis.get(`pwd_reset:${token}`);
        if (!userId) {
            return reply.status(400).send({ success: false, error: 'Invalid or expired reset link' });
        }
        const passwordHash = await argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: 65536,
            timeCost: 3,
        });
        await server_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        // Invalidate all sessions
        await server_1.prisma.session.updateMany({
            where: { userId },
            data: { isActive: false },
        });
        await server_1.redis.del(`pwd_reset:${token}`);
        await (0, auth_1.auditLog)(userId, 'PASSWORD_RESET', 'User', userId, undefined, undefined, request);
        return reply.send({ success: true, message: 'Password reset successfully' });
    });
    // POST /auth/change-password
    app.post('/change-password', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
        const userId = request.user.userId;
        const user = await server_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return reply.status(404).send({ success: false, error: 'User not found' });
        const valid = await argon2_1.default.verify(user.passwordHash, currentPassword);
        if (!valid) {
            return reply.status(401).send({ success: false, error: 'Current password is incorrect' });
        }
        const passwordHash = await argon2_1.default.hash(newPassword, { type: argon2_1.default.argon2id });
        await server_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        // Invalidate other sessions
        await server_1.prisma.session.updateMany({
            where: { userId, NOT: { id: request.user.sessionId } },
            data: { isActive: false },
        });
        await (0, auth_1.auditLog)(userId, 'PASSWORD_CHANGED', 'User', userId, undefined, undefined, request);
        return reply.send({ success: true, message: 'Password changed successfully' });
    });
    // POST /auth/2fa/setup
    app.post('/2fa/setup', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const userId = request.user.userId;
        const user = await server_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, twoFactorEnabled: true },
        });
        if (user?.twoFactorEnabled) {
            return reply.status(400).send({ success: false, error: '2FA is already enabled' });
        }
        const secret = otplib.authenticator.generateSecret();
        const otpauth = otplib.authenticator.keyuri(user.email, 'MegaDraw', secret);
        const qrCode = await (0, qr_1.generateQR)(otpauth);
        // Store secret temporarily until confirmed
        await server_1.redis.setex(`2fa_setup:${userId}`, 600, secret); // 10min TTL
        return reply.send({
            success: true,
            data: { secret, qrCode },
        });
    });
    // POST /auth/2fa/confirm
    app.post('/2fa/confirm', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { token } = request.body;
        const userId = request.user.userId;
        const secret = await server_1.redis.get(`2fa_setup:${userId}`);
        if (!secret) {
            return reply.status(400).send({ success: false, error: 'Setup session expired. Please restart.' });
        }
        const valid = otplib.authenticator.verify({ token, secret });
        if (!valid) {
            return reply.status(400).send({ success: false, error: 'Invalid code. Try again.' });
        }
        await server_1.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true, twoFactorSecret: secret },
        });
        await server_1.redis.del(`2fa_setup:${userId}`);
        await (0, auth_1.auditLog)(userId, '2FA_ENABLED', 'User', userId, undefined, undefined, request);
        return reply.send({ success: true, message: 'Two-factor authentication enabled' });
    });
    // DELETE /auth/2fa
    app.delete('/2fa', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { password, token } = request.body;
        const userId = request.user.userId;
        const user = await server_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return reply.status(404).send({ success: false, error: 'User not found' });
        const validPwd = await argon2_1.default.verify(user.passwordHash, password);
        if (!validPwd) {
            return reply.status(401).send({ success: false, error: 'Invalid password' });
        }
        const validTOTP = otplib.authenticator.verify({
            token,
            secret: user.twoFactorSecret,
        });
        if (!validTOTP) {
            return reply.status(401).send({ success: false, error: 'Invalid authenticator code' });
        }
        await server_1.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null },
        });
        await (0, auth_1.auditLog)(userId, '2FA_DISABLED', 'User', userId, undefined, undefined, request);
        return reply.send({ success: true, message: 'Two-factor authentication disabled' });
    });
    // GET /auth/sessions
    app.get('/sessions', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const sessions = await server_1.prisma.session.findMany({
            where: { userId: request.user.userId, isActive: true },
            orderBy: { lastUsedAt: 'desc' },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                deviceName: true,
                lastUsedAt: true,
                createdAt: true,
                expiresAt: true,
            },
        });
        const formattedSessions = sessions.map(s => {
            const parsedDevice = s.deviceName || parseDeviceName(s.userAgent || '');
            const parsedBrowser = parseBrowserName(s.userAgent || '');
            return {
                id: s.id,
                device: parsedDevice,
                browser: parsedBrowser,
                ipAddress: s.ipAddress || '127.0.0.1',
                lastActiveAt: s.lastUsedAt || s.createdAt || new Date(),
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
            };
        });
        return reply.send({ success: true, data: formattedSessions });
    });
    // DELETE /auth/sessions/:id
    app.delete('/sessions/:id', { preHandler: auth_1.authenticate }, async (request, reply) => {
        const { id } = request.params;
        await server_1.prisma.session.updateMany({
            where: { id, userId: request.user.userId },
            data: { isActive: false },
        });
        return reply.send({ success: true, message: 'Session terminated' });
    });
}
function parseDeviceName(userAgent) {
    if (!userAgent)
        return 'Desktop PC';
    if (/Android/i.test(userAgent))
        return 'Android Device';
    if (/iPhone/i.test(userAgent))
        return 'iPhone';
    if (/iPad/i.test(userAgent))
        return 'iPad';
    if (/Windows/i.test(userAgent))
        return 'Windows PC';
    if (/Macintosh/i.test(userAgent))
        return 'Mac Workstation';
    if (/Linux/i.test(userAgent))
        return 'Linux PC';
    return 'Desktop Device';
}
function parseBrowserName(userAgent) {
    if (!userAgent)
        return 'Web Browser';
    if (/Brave/i.test(userAgent))
        return 'Brave Browser';
    if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent))
        return 'Google Chrome';
    if (/Edg/i.test(userAgent))
        return 'Microsoft Edge';
    if (/Firefox/i.test(userAgent))
        return 'Mozilla Firefox';
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent))
        return 'Apple Safari';
    return 'Web Browser';
}
//# sourceMappingURL=auth.js.map