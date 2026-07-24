import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  let count = 0
  
  for (const user of users) {
    if (user.referralCode.length > 8) { // Only update if it's longer than 8 (i.e. the old cuid)
      const newCode = Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')
      
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: newCode }
      })
      console.log(`Updated user ${user.email} with new referral code: ${newCode}`)
      count++
    }
  }
  console.log(`\nSuccessfully updated ${count} old user accounts.`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
