import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type Friend = Pick<Scout, 'id' | 'avatar' | 'displayName' | 'currentBalance'>;

const optimismTokenDecimals = 18;

export async function getFriends(userId?: string): Promise<{ friends: Friend[]; tokensEarned: number }> {
  if (!userId) {
    return { friends: [], tokensEarned: 0 };
  }

  const scoutWallets = await prisma.scoutWallet.findMany({
    where: {
      scoutId: userId
    },
    select: {
      address: true
    }
  });

  const friends = await prisma.referralCodeEvent.findMany({
    where: {
      builderEvent: { builderId: userId }
    },
    include: {
      referee: {
        select: {
          id: true,
          avatar: true,
          displayName: true,
          currentBalance: true
        }
      }
    }
  });
  const payouts = await prisma.partnerRewardPayout.findMany({
    where: {
      payoutContract: {
        partner: 'optimism_referral_champion'
      },
      walletAddress: {
        in: scoutWallets.map((w) => w.address)
      }
    }
  });
  const tokensEarned = Math.floor(
    payouts.reduce((acc, payout) => acc + Number(payout.amount) / 10 ** optimismTokenDecimals, 0)
  );

  return { friends: friends.map((friend) => friend.referee), tokensEarned };
}
