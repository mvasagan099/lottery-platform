import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = [
  'Dashboard', 'Reports', 'Users', 'KYC', 'Wallets', 'Deposits', 'Withdrawals', 
  'Games', 'Draws', 'Results', 'Jackpots', 'Affiliates', 'CMS', 'Promotions', 
  'Support', 'Audit Logs', 'Analytics', 'Notifications', 'Settings', 'API Keys', 'Backups'
];

const ACTIONS = [
  'View', 'Create', 'Edit', 'Delete', 'Approve', 'Reject', 'Export', 'Import', 'Manage', 'Assign', 'Configure'
];

async function main() {
  console.log('Seeding permissions...');
  let count = 0;
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const existing = await prisma.permission.findFirst({
        where: { module, action }
      });
      if (!existing) {
        await prisma.permission.create({
          data: {
            module,
            action,
            description: `Allows ${action} on ${module}`
          }
        });
        count++;
      }
    }
  }
  console.log(`Seeded ${count} new permissions!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
