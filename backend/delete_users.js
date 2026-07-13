const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { username: { in: ['mvasagan', 'mvasagan2'] } }
  });
  const userIds = users.map(u => u.id);
  if (userIds.length > 0) {
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.deviceHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log('Deleted test users completely');
  } else {
    console.log('No test users found');
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
