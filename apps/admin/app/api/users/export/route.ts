import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { isOnchainPlatform } from '@packages/utils/platform';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

const whitelistedSeasons = ['2024-W41', '2025-W02'];

type ScoutWithGithubUser = {
  id: string;
  path: string;
  createdAt: string;
  email?: string;
  tokenId?: number;
  optedInToMarketing?: string;
  builderStatus?: string;
  githubLogin?: string;
  fid?: number;
  farcasterName?: string;
  currentBalance: number;
  regularNftsPurchased: number;
  regularNftsSold: number;
  starterNftsPurchased: number;
  starterNftsSold: number;
  usdcPaidForNfts: number;
  pointsEarnedAsScout: number;
  pointsEarnedAsDeveloper: number;
  pointsEarnedTotal: number;
  dailyClaimsCount: number;
  questsCompleted: number;
  referrals: number;
  referralsCompleted: number;
  developerLevel?: number;
  season: string;
  waitlistTier: string;
};

export async function GET() {
  const users = await prisma.scout.findMany({
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      onboardedAt: true,
      path: true,
      sendMarketing: true,
      createdAt: true,
      avatar: true,
      email: true,
      builderStatus: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true,
      currentBalanceDevToken: true,
      githubUsers: {
        select: {
          login: true
        }
      },
      events: {
        where: {
          type: {
            in: ['referral', 'daily_claim', 'misc_event']
          }
        },
        include: {
          referralCodeEvent: {
            select: {
              completedAt: true
            }
          }
        }
      },
      socialQuests: {
        select: {
          season: true
        }
      },
      pendingNftTransactions: {
        select: {
          status: true,
          destinationChainTxHash: true,
          targetAmountReceived: true
        }
      },
      wallets: {
        select: {
          purchaseEvents: {
            select: {
              paidInPoints: true,
              pointsValue: true,
              tokensPurchased: true,
              txHash: true,
              builderNft: {
                select: {
                  nftType: true,
                  season: true
                }
              }
            }
          }
        }
      },
      userSeasonStats: {
        select: {
          season: true,
          pointsEarnedAsScout: true,
          pointsEarnedAsBuilder: true,
          level: true
        }
      },
      userWeeklyStats: true,
      pointsReceived: true,
      builderNfts: {
        select: {
          season: true,
          nftType: true,
          tokenId: true,
          nftSoldEvents: {
            select: {
              tokensPurchased: true
            }
          }
        }
      }
    }
  });
  const rows: ScoutWithGithubUser[] = users.flatMap((user) => {
    const allUserPurchaseEvents = user.wallets
      .flatMap((wallet) => wallet.purchaseEvents)
      .filter(
        (e) =>
          !e.paidInPoints &&
          user.pendingNftTransactions.some((tx) => {
            const isMatch = tx.destinationChainTxHash === e.txHash && tx.status === 'completed';
            const isAmountMatch = Number(tx.targetAmountReceived) / 10 ** 6 === e.pointsValue / 10;
            // TODO: pointsValue is sometimes higher than the target amount received. This is a hack to fix it.
            if (isMatch && !isAmountMatch) {
              // console.log('mismatched values.', convertCostToPoints(tx.targetAmountReceived), 'tx', tx, 'e', e);
              e.pointsValue = convertCostToPoints(tx.targetAmountReceived);
            }
            return isMatch;
          })
      );
    // Create a map with shared user data
    const sharedUserData = {
      id: user.id,
      onboardedAt: user.onboardedAt?.toDateString(),
      path: `https://scoutgame.xyz/u/${user.path!}`,
      createdAt: user.createdAt.toDateString(),
      email: user.email || undefined,
      optedInToMarketing: user.sendMarketing ? 'Yes' : '',
      builderStatus: user.builderStatus || undefined,
      fid: user.farcasterId || undefined,
      farcasterName: user.farcasterName || undefined,
      githubLogin: user.githubUsers[0]?.login,
      currentBalance: isOnchainPlatform()
        ? Number(BigInt(user.currentBalanceDevToken ?? 0) / BigInt(10 ** 18))
        : user.currentBalance || 0,
      pointsEarnedTotal: user.pointsReceived
        .filter((p) => p.season === getCurrentSeasonStart())
        .reduce((acc, curr) => acc + curr.value, 0)
    };
    const activeSeasons = [
      ...user.userSeasonStats,
      ...user.events,
      ...user.pointsReceived,
      ...allUserPurchaseEvents.map((e) => e.builderNft)
    ]
      .filter(({ season }) => whitelistedSeasons.includes(season))
      .reduce<string[]>((acc, curr) => {
        if (!acc.includes(curr.season) && whitelistedSeasons.includes(curr.season)) {
          acc.push(curr.season);
        }
        return acc;
      }, []);
    // If user has no season stats, create one row with default values
    if (activeSeasons.length === 0) {
      return [
        // If user has no season stats, return one row with default values
        {
          ...sharedUserData,
          pointsEarnedAsScout: 0,
          pointsEarnedAsDeveloper: 0,
          referrals: 0,
          dailyClaimsCount: 0,
          questsCompleted: 0,
          referralsCompleted: 0,
          regularNftsPurchased: 0,
          regularNftsSold: 0,
          starterNftsPurchased: 0,
          starterNftsSold: 0,
          usdcPaidForNfts: 0,
          season: '',
          waitlistTier: ''
        }
      ];
    }

    // Create one row per season
    return activeSeasons.map((season) => {
      const seasonStat = user.userSeasonStats.find((s) => s.season === season);
      const purchaseEvents = allUserPurchaseEvents.filter((e) => e.builderNft?.season === season);
      const builderEvents = user.events.filter((e) => e.season === season);
      const socialQuests = user.socialQuests.filter((q) => q.season === season);
      const regularNft = user.builderNfts.find((nft) => nft.season === season && nft.nftType === 'default');
      const starterNft = user.builderNfts.find((nft) => nft.season === season && nft.nftType === 'starter_pack');
      const usdcPaidForNfts = purchaseEvents.reduce((acc, curr) => acc + curr.pointsValue / 10, 0);
      return {
        ...sharedUserData,
        tokenId: regularNft?.tokenId || undefined,
        pointsEarnedAsScout: seasonStat?.pointsEarnedAsScout || 0,
        pointsEarnedAsDeveloper: seasonStat?.pointsEarnedAsBuilder || 0,
        pointsEarnedTotal: user.pointsReceived
          .filter((p) => p.season === season)
          .reduce((acc, curr) => acc + curr.value, 0),
        regularNftsPurchased: purchaseEvents
          .filter((e) => e.builderNft?.nftType === 'default')
          .reduce((acc, curr) => acc + curr.tokensPurchased, 0),
        regularNftsSold: regularNft?.nftSoldEvents.reduce((acc, curr) => acc + curr.tokensPurchased, 0) || 0,
        starterNftsPurchased: purchaseEvents
          .filter((e) => e.builderNft?.nftType === 'starter_pack')
          .reduce((acc, curr) => acc + curr.tokensPurchased, 0),
        starterNftsSold: starterNft?.nftSoldEvents.reduce((acc, curr) => acc + curr.tokensPurchased, 0) || 0,
        usdcPaidForNfts,
        developerLevel: seasonStat?.level,
        season,
        referrals: builderEvents.filter((e) => e.type === 'referral').length,
        referralsCompleted: builderEvents.filter((e) => e.type === 'referral' && e.referralCodeEvent?.completedAt)
          .length,
        dailyClaimsCount: builderEvents.filter((e) => e.type === 'daily_claim').length,
        questsCompleted: socialQuests.length,
        waitlistTier:
          builderEvents
            .find((e) => e.type === 'misc_event' && e.description?.includes('waitlist'))
            ?.description?.match(/achieving (.*?) status/)?.[1] || ''
      };
    });
  });

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
