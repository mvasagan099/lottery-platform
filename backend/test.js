const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.banner.findMany().then(b => {
  console.log(JSON.stringify(b, null, 2));
  prisma.$disconnect();
});
