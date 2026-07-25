import { prisma } from '../server'

/**
 * Process referral and affiliate commission when a user performs an activity (SIGNUP, DEPOSIT, TICKET_PURCHASE).
 */
export async function processAffiliateCommission({
  referredUserId,
  type,
  amount = 0,
}: {
  referredUserId: string
  type: 'SIGNUP' | 'DEPOSIT' | 'TICKET_PURCHASE'
  amount?: number
}) {
  try {
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { id: true, referredById: true },
    })

    if (!referredUser || !referredUser.referredById) {
      return
    }

    const referrerId = referredUser.referredById

    // Find or create affiliate account for the referrer
    let affiliate = await prisma.affiliateAccount.findUnique({
      where: { userId: referrerId },
    })

    if (!affiliate) {
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { referralCode: true },
      })
      if (!referrer) return

      affiliate = await prisma.affiliateAccount.create({
        data: {
          userId: referrerId,
          affiliateCode: referrer.referralCode,
        },
      })
    }

    if (!affiliate.isActive) return

    if (type === 'SIGNUP') {
      await prisma.affiliateAccount.update({
        where: { id: affiliate.id },
        data: { totalSignups: { increment: 1 } },
      })
      return
    }

    // For DEPOSIT or TICKET_PURCHASE, calculate commission based on commissionRate %
    const rate = Number(affiliate.commissionRate || 10) // default 10%
    const commissionAmount = (amount * rate) / 100

    if (commissionAmount <= 0) return

    await prisma.$transaction(async (tx) => {
      // 1. Create commission record
      await tx.affiliateCommission.create({
        data: {
          affiliateId: affiliate.id,
          referredUserId,
          type: type === 'DEPOSIT' ? 'DEPOSIT' : 'TICKET_PURCHASE',
          amount: commissionAmount,
          isPaid: false,
        },
      })

      // 2. Update affiliate account financial totals
      await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: {
          pendingAmount: { increment: commissionAmount },
          totalEarned: { increment: commissionAmount },
          ...(type === 'DEPOSIT' ? { totalDeposits: { increment: amount } } : {}),
        },
      })

      // 3. Create a transaction for audit history if needed or referral bonus entry
      const referrerWallet = await tx.wallet.findUnique({ where: { userId: referrerId } })
      if (referrerWallet) {
        await tx.transaction.create({
          data: {
            userId: referrerId,
            walletId: referrerWallet.id,
            type: 'AFFILIATE_COMMISSION',
            status: 'COMPLETED',
            amount: commissionAmount,
            balanceBefore: Number(referrerWallet.balance),
            balanceAfter: Number(referrerWallet.balance), // Pending until paid or credited directly
            reference: `COMM-${type}-${referredUserId.substring(0, 6)}`,
            description: `Affiliate commission (${rate}%) from referred user ${type.toLowerCase()}`,
          },
        })
      }
    })
  } catch (err) {
    console.error('Error processing affiliate commission:', err)
  }
}
