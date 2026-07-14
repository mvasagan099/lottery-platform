import { z } from 'zod';

export const GeneralSettingsSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  supportEmail: z.string().email('Invalid email address'),
  supportPhone: z.string().min(1, 'Support phone is required'),
  websiteUrl: z.string().url('Invalid URL'),
  copyright: z.string(),
  timezone: z.string(),
  language: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  numberFormat: z.string(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
});
export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;

export const LotterySettingsSchema = z.object({
  defaultCurrency: z.string(),
  ticketPurchaseLimit: z.number().min(1),
  minTicketPrice: z.number().min(0.01),
  maxTicketPrice: z.number().min(0.01),
  jackpotRollOver: z.boolean(),
  autoDraw: z.boolean(),
  drawTimezone: z.string(),
  resultPublishDelay: z.number(),
  winnerVerification: z.boolean(),
  claimExpiryDays: z.number(),
  autoPrizeDistribution: z.boolean(),
});
export type LotterySettings = z.infer<typeof LotterySettingsSchema>;

export const UserSettingsSchema = z.object({
  registrationEnabled: z.boolean(),
  emailVerification: z.boolean(),
  phoneVerification: z.boolean(),
  kycRequired: z.boolean(),
  minimumAge: z.number().min(18),
  referralSystem: z.boolean(),
  affiliateProgram: z.boolean(),
  vipProgram: z.boolean(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const WalletSettingsSchema = z.object({
  minDeposit: z.number().min(0),
  maxDeposit: z.number().min(0),
  minWithdrawal: z.number().min(0),
  maxWithdrawal: z.number().min(0),
  dailyDepositLimit: z.number().min(0),
  dailyWithdrawalLimit: z.number().min(0),
  bonusWalletEnabled: z.boolean(),
});
export type WalletSettings = z.infer<typeof WalletSettingsSchema>;

export const SecuritySettingsSchema = z.object({
  jwtExpiryHours: z.number().min(1),
  refreshTokenExpiryDays: z.number().min(1),
  sessionTimeoutMinutes: z.number().min(1),
  twoFactorAuth: z.boolean(),
  deviceVerification: z.boolean(),
  loginAlerts: z.boolean(),
  rateLimiting: z.boolean(),
  bruteForceProtection: z.boolean(),
});
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;

export type SystemSettings = {
  general: GeneralSettings;
  lottery: LotterySettings;
  user: UserSettings;
  wallet: WalletSettings;
  security: SecuritySettings;
};
