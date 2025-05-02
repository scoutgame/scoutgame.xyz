import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { getEstimatedTokensForWeek } from '@packages/scoutgame/tokens/getEstimatedTokensForWeek';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

const whitelistedSeasons = ['2024-W41', '2025-W02'];

type ScoutWithGithubUser = {
  id: string;
  path: string;
  createdAt: string;
  displayName: string;
  email?: string;
  tokenId?: number;
  wallet?: string;
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
  currentWeekTokens: number;
  tokensEarnedTotal: number;
  dailyClaimsCount: number;
  questsCompleted: number;
  referrals: number;
  referralsCompleted: number;
  developerLevel?: number;
  season: string;
  waitlistTier: string;
};

export async function GET() {
  const collapseSeasons = true;

  const users = await prisma.scout.findMany({
    where: {
      deletedAt: null,
      id: 'f4e7cc3d-be93-420a-b49b-401dddd380e9'
    },
    select: {
      id: true,
      onboardedAt: true,
      path: true,
      sendMarketing: true,
      createdAt: true,
      avatar: true,
      displayName: true,
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
          primary: true,
          address: true,
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
      pointsReceived: {
        select: {
          season: true,
          value: true
        }
      },
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

  let estimatedTokensPerScout: Record<string, number> = {};
  try {
    ({ tokensPerScout: estimatedTokensPerScout } = await getEstimatedTokensForWeek({ week: getCurrentWeek() }));
  } catch (error) {
    // console.error(error);
  }

  const rows: ScoutWithGithubUser[] = users.flatMap((user): ScoutWithGithubUser | ScoutWithGithubUser[] => {
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
    const userProfile = {
      id: user.id,
      onboardedAt: user.onboardedAt?.toDateString(),
      path: `https://scoutgame.xyz/u/${user.path!}`,
      wallet: user.wallets.find((w) => w.primary)?.address || user.wallets[0]?.address,
      createdAt: user.createdAt.toDateString(),
      displayName: user.displayName,
      email: user.email || undefined,
      optedInToMarketing: user.sendMarketing ? 'Yes' : '',
      builderStatus: user.builderStatus || undefined,
      fid: user.farcasterId || undefined,
      farcasterName: user.farcasterName || undefined,
      githubLogin: user.githubUsers[0]?.login,
      currentBalance: Number(BigInt(user.currentBalanceDevToken ?? 0) / BigInt(10 ** 18)),
      currentWeekTokens: estimatedTokensPerScout[user.id] || 0,
      tokensEarnedTotal: estimatedTokensPerScout[user.id] || 0
    } as const;
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
      return {
        ...userProfile,
        pointsEarnedAsScout: 0,
        pointsEarnedAsDeveloper: 0,
        pointsEarnedTotal: 0,
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
      };
    }
    // Create one row per season
    const seasonRows = activeSeasons
      // calculate stats per active season
      .map((season) => {
        const seasonStat = user.userSeasonStats.find((s) => s.season === season);
        const purchaseEvents = allUserPurchaseEvents.filter((e) => e.builderNft?.season === season);
        const builderEvents = user.events.filter((e) => e.season === season);
        const socialQuests = user.socialQuests.filter((q) => q.season === season);
        const regularNft = user.builderNfts.find((nft) => nft.season === season && nft.nftType === 'default');
        const starterNft = user.builderNfts.find((nft) => nft.season === season && nft.nftType === 'starter_pack');
        const usdcPaidForNfts = purchaseEvents.reduce((acc, curr) => acc + curr.pointsValue / 10, 0);
        return {
          ...userProfile,
          tokenId: regularNft?.tokenId || undefined,
          pointsEarnedAsScout: seasonStat?.pointsEarnedAsScout || 0,
          pointsEarnedAsDeveloper: seasonStat?.pointsEarnedAsBuilder || 0,
          pointsEarnedTotal: user.pointsReceived
            .filter((p) => p.season === season)
            .reduce((acc, curr) => acc + curr.value, userProfile.currentWeekTokens),
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
    if (!collapseSeasons) {
      return seasonRows;
    }
    // combine into one row
    return seasonRows.reduce(
      (acc, curr) => {
        return {
          ...acc,
          pointsEarnedAsScout: acc.pointsEarnedAsScout + curr.pointsEarnedAsScout,
          pointsEarnedAsDeveloper: acc.pointsEarnedAsDeveloper + curr.pointsEarnedAsDeveloper,
          pointsEarnedTotal: acc.pointsEarnedTotal + curr.pointsEarnedTotal,
          regularNftsPurchased: acc.regularNftsPurchased + curr.regularNftsPurchased,
          regularNftsSold: acc.regularNftsSold + curr.regularNftsSold,
          starterNftsPurchased: acc.starterNftsPurchased + curr.starterNftsPurchased,
          starterNftsSold: acc.starterNftsSold + curr.starterNftsSold,
          usdcPaidForNfts: acc.usdcPaidForNfts + curr.usdcPaidForNfts,
          referrals: acc.referrals + curr.referrals,
          referralsCompleted: acc.referralsCompleted + curr.referralsCompleted,
          dailyClaimsCount: acc.dailyClaimsCount + curr.dailyClaimsCount,
          questsCompleted: acc.questsCompleted + curr.questsCompleted,
          developerLevel: undefined, // acc.developerLevel || curr.developerLevel,
          season: '', // acc.season || curr.season,
          waitlistTier: acc.waitlistTier || curr.waitlistTier
        };
      },
      {
        ...userProfile,
        pointsEarnedAsScout: 0,
        pointsEarnedAsDeveloper: 0,
        pointsEarnedTotal: 0,
        referrals: 0,
        dailyClaimsCount: 0,
        questsCompleted: 0,
        referralsCompleted: 0,
        regularNftsPurchased: 0,
        regularNftsSold: 0,
        starterNftsPurchased: 0,
        starterNftsSold: 0,
        usdcPaidForNfts: 0,
        waitlistTier: '',
        season: ''
      }
    );
  });

  // const top50Builders = rows.sort((a, b) => b.pointsEarnedAsDeveloper - a.pointsEarnedAsDeveloper).slice(0, 50);
  // const top50BuildersRows = top50Builders.map((builder) => ({
  //   address: builder.wallet,
  //   username: builder.farcasterName || builder.displayName,
  //   points: builder.pointsEarnedAsDeveloper
  // }));

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
