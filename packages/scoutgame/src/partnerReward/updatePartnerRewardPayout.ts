import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

export async function updatePartnerRewardPayout({
  payoutContractId,
  txHash,
  userId
}: {
  payoutContractId: string;
  txHash: string;
  userId: string;
}) {
  const payout = await prisma.partnerRewardPayout.findFirstOrThrow({
    where: {
      payoutContractId,
      wallet: {
        scout: {
          id: userId
        }
      }
    },
    select: {
      claimedAt: true,
      payoutContractId: true,
      payoutContract: {
        select: {
          partner: true,
          week: true,
          season: true
        }
      }
    }
  });

  if (payout.claimedAt) {
    throw new Error('Partner reward payout already claimed');
  }

  await prisma.partnerRewardPayout.updateMany({
    where: {
      payoutContractId: payout.payoutContractId,
      wallet: {
        scout: {
          id: userId
        }
      }
    },
    data: {
      claimedAt: new Date(),
      txHash
    }
  });

  trackUserAction('claim_partner_reward', {
    userId,
    partner: payout.payoutContract.partner,
    week: payout.payoutContract.week,
    season: payout.payoutContract.season
  });
}
