import cron from 'node-cron'
import { prisma } from '../server'
import crypto from 'crypto'
const parser = require('cron-parser')

function generateNumbers(pool: number, count: number): number[] {
  const nums = new Set<number>()
  while (nums.size < count) {
    nums.add(crypto.randomInt(1, pool + 1))
  }
  return Array.from(nums).sort((a, b) => a - b)
}

export function initCronJobs() {
  console.log('🕒 Initializing Cron Jobs...')

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()
      
      // Find draws that are scheduled to run
      const pendingDraws = await prisma.draw.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now }
        },
        include: {
          game: {
            include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } }
          },
          tickets: {
            include: { numbers: true }
          }
        }
      })

      if (pendingDraws.length > 0) {
        console.log(`🎰 Found ${pendingDraws.length} draws to execute.`)
      }

      for (const draw of pendingDraws) {
        console.log(`Executing Draw #${draw.drawNumber} for ${draw.game.name}`)

        // 1. Generate Winning Numbers
        const winningNumbers = generateNumbers(draw.game.numberPool, draw.game.minNumbers)
        const powerball = draw.game.hasPowerball ? crypto.randomInt(1, draw.game.powerballPool! + 1) : null

        // 2. Mark as IN_PROGRESS
        await prisma.draw.update({
          where: { id: draw.id },
          data: {
            status: 'IN_PROGRESS',
            winningNumbers,
            powerball,
            drawnAt: now
          }
        })

        let totalPrizes = 0

        // 3. Process Tickets
        for (const ticket of draw.tickets) {
          if (ticket.status === 'CANCELLED') continue

          let bestDivision: any = null
          let bestPrize = 0

          for (const line of ticket.numbers) {
            const nums = line.numbers as number[]
            const matched = nums.filter((n) => winningNumbers.includes(n)).length
            const pbMatched = powerball && line.powerball === powerball

            for (const div of draw.game.prizeDivisions) {
              const numMatch = div.matchNumbers === matched
              const pbMatch = !div.matchPB || pbMatched

              if (numMatch && pbMatch) {
                const prizeAmt = Number(div.fixedPrize || draw.jackpotAmount)
                if (prizeAmt > bestPrize) {
                  bestPrize = prizeAmt
                  bestDivision = div
                }
                break
              }
            }
          }

          if (bestDivision && bestPrize > 0) {
            // Winning ticket
            await prisma.winningEntry.create({
              data: {
                ticketId: ticket.id,
                drawId: draw.id,
                divisionName: bestDivision.divisionName,
                prizeAmount: bestPrize,
              },
            })

            await prisma.ticket.update({
              where: { id: ticket.id },
              data: {
                status: 'WON',
                prizeAmount: bestPrize,
                prizeDivision: bestDivision.divisionName,
              },
            })

            await prisma.notification.create({
              data: {
                userId: ticket.userId,
                title: '🏆 You won a prize!',
                message: `Congratulations! You won ${bestDivision.divisionName} ($${bestPrize.toFixed(2)}) in Draw #${draw.drawNumber}!`,
                data: { ticketId: ticket.id, drawId: draw.id },
              },
            })

            // Credit wallet
            const wallet = await prisma.wallet.findUnique({ where: { userId: ticket.userId } })
            if (wallet) {
              await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: bestPrize }, totalWon: { increment: bestPrize } }
              })
              await prisma.transaction.create({
                data: {
                  userId: ticket.userId,
                  walletId: wallet.id,
                  type: 'PRIZE_CREDIT',
                  amount: bestPrize,
                  balanceBefore: Number(wallet.balance),
                  balanceAfter: Number(wallet.balance) + bestPrize,
                  reference: draw.id,
                  description: `Winnings from Draw #${draw.drawNumber}`,
                  status: 'COMPLETED'
                }
              })
            }

            totalPrizes += bestPrize
          } else {
            // Losing ticket
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { status: 'LOST' },
            })
          }
        }

        // 4. Update draw to COMPLETED
        await prisma.draw.update({
          where: { id: draw.id },
          data: { status: 'COMPLETED' },
        })

        // 5. Schedule Next Draw
        if (draw.game.drawSchedule) {
          try {
            const interval = parser.parseExpression(draw.game.drawSchedule, { currentDate: now })
            const nextDate = interval.next().toDate()
            
            await prisma.draw.create({
              data: {
                gameId: draw.game.id,
                drawNumber: draw.drawNumber + 1,
                scheduledAt: nextDate,
                jackpotAmount: draw.jackpotAmount, // keep same jackpot or increment? keeping same for now
                status: 'SCHEDULED'
              }
            })
            console.log(`📅 Scheduled next draw for ${draw.game.name} on ${nextDate.toISOString()}`)
          } catch (e) {
            console.error('Failed to schedule next draw:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error executing draws cron:', error)
    }
  })
}
