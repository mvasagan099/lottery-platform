import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.banner.findFirst({
    where: { position: 'HOME' }
  })

  if (!existing) {
    await prisma.banner.create({
      data: {
        title: `Win Big with<br /><span class="jackpot-text">World's Biggest</span><br />Jackpots`,
        description: 'Play MegaDraw, Powerball, Saturday Lotto and 6 more games — all in one place. Safe, secure, and 100% global.',
        imageUrl: '',
        linkUrl: '/games',
        position: 'HOME',
        isActive: true,
        sortOrder: 0
      }
    })
    console.log('Seeded HOME banner')
  } else {
    console.log('HOME banner already exists')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
