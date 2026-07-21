"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seed() {
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@lottery.com',
                username: 'admin',
                passwordHash: 'dummy_hash',
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
    }
    else {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
    }
    const agent = await prisma.supportAgent.upsert({
        where: { userId: user.id },
        update: { role: 'SUPER_ADMIN', status: 'ONLINE', employeeId: 'EMP-001' },
        create: { userId: user.id, employeeId: 'EMP-001', role: 'SUPER_ADMIN', status: 'ONLINE', timeZone: 'UTC' }
    });
    console.log('Seeded agent:', agent);
}
seed().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-agent.js.map