import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
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
  nftsPurchased: number;
  nftsSold: number;
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
      githubUsers: true,
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
      socialQuests: true,
      userSeasonStats: true,
      userWeeklyStats: true,
      pointsReceived: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        }
      }
    }
  });
  const rows: ScoutWithGithubUser[] = users.flatMap((user) => {
    // Create a map with shared user data
    const sharedUserData = {
      id: user.id,
      onboardedAt: user.onboardedAt?.toDateString(),
      path: `https://scoutgame.xyz/${user.path!}`,
      createdAt: user.createdAt.toDateString(),
      email: user.email || undefined,
      optedInToMarketing: user.sendMarketing ? 'Yes' : '',
      builderStatus: user.builderStatus || undefined,
      tokenId: user.builderNfts[0]?.tokenId || undefined,
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
    const seasonBasedOnPoints = [...user.events, ...user.pointsReceived]
      .filter(({ season }) => whitelistedSeasons.includes(season))
      .reduce<string[]>((acc, curr) => {
        if (acc.includes(curr.season)) {
          return acc;
        }
        acc.push(curr.season);
        return acc;
      }, []);

    // If user has no season stats, create one row with default values
    if (user.userSeasonStats.length === 0) {
      if (seasonBasedOnPoints.length > 0) {
        return seasonBasedOnPoints.map((season) => {
          const builderEvents = user.events.filter((e) => e.season === season);
          const socialQuests = user.socialQuests.filter((q) => q.season === season);
          return {
            ...sharedUserData,
            pointsEarnedAsScout: 0,
            pointsEarnedAsDeveloper: 0,
            pointsEarnedTotal: user.pointsReceived.reduce((acc, curr) => {
              if (curr.season === season) {
                return acc + curr.value;
              }
              return acc;
            }, 0),
            referrals: builderEvents.filter((e) => e.type === 'referral').length,
            referralsCompleted: builderEvents.filter((e) => e.type === 'referral' && e.referralCodeEvent?.completedAt)
              .length,
            dailyClaimsCount: builderEvents.filter((e) => e.type === 'daily_claim').length,
            questsCompleted: socialQuests.length,
            waitlistTier:
              builderEvents
                .find((e) => e.type === 'misc_event' && e.description?.includes('waitlist'))
                ?.description?.match(/achieving (.*?) status/)?.[1] || '',
            nftsPurchased: 0,
            nftsSold: 0,
            season
          };
        });
      }
      return [
        // If user has no season stats, return one row with default values
        {
          ...sharedUserData,
          pointsEarnedAsScout: 0,
          pointsEarnedAsDeveloper: 0,
          nftsPurchased: 0,
          nftsSold: 0,
          referrals: 0,
          dailyClaimsCount: 0,
          questsCompleted: 0,
          referralsCompleted: 0,
          season: '',
          waitlistTier: ''
        }
      ];
    }

    // Create one row per season stat
    return user.userSeasonStats
      .filter(({ season }) => whitelistedSeasons.includes(season))
      .map((seasonStat) => {
        const builderEvents = user.events.filter((e) => e.season === seasonStat.season);
        const socialQuests = user.socialQuests.filter((q) => q.season === seasonStat.season);
        return {
          ...sharedUserData,
          pointsEarnedAsScout: seasonStat.pointsEarnedAsScout,
          pointsEarnedAsDeveloper: seasonStat.pointsEarnedAsBuilder,
          pointsEarnedTotal: user.pointsReceived.reduce((acc, curr) => {
            if (curr.season === seasonStat.season) {
              return acc + curr.value;
            }
            return acc;
          }, 0),
          nftsPurchased: seasonStat.nftsPurchased,
          nftsSold: seasonStat.nftsSold || 0,
          developerLevel: seasonStat.level,
          season: seasonStat.season,
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
