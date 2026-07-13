const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRaw`INSERT INTO "coupons" ("id", "code", "amount", "isUsed", "createdAt") VALUES ('c1', 'FREE100', 100.00, false, NOW()) ON CONFLICT ("code") DO NOTHING`;
  console.log('Created test coupon FREE100 for $100');
}
main().catch(console.error).finally(() => prisma.$disconnect());
