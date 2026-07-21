const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up dummy demo data...')

  const demoUsernames = ['john_doe', 'sarah_c', 'alex_s']

  for (const username of demoUsernames) {
    const user = await prisma.user.findUnique({ where: { username } })
    if (user) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
      if (wallet) {
        await prisma.deposit.deleteMany({ where: { walletId: wallet.id } })
        await prisma.withdrawal.deleteMany({ where: { walletId: wallet.id } })
        await prisma.transaction.deleteMany({ where: { walletId: wallet.id } })
        await prisma.wallet.delete({ where: { id: wallet.id } })
      }
      await prisma.user.delete({ where: { id: user.id } })
      console.log(`Deleted demo user: ${username}`)
    }
  }

  console.log('✨ Cleanup complete! Database now holds real user data only.')
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
