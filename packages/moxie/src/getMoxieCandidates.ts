import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getLastWeek, getSeasonWeekFromISOWeek } from '@packages/dates/utils';
import { uniq } from 'lodash';

import { airstackRequest } from './airstackRequest';

export type MoxieBonusRow = {
  'Scout ID': string;
  'Scout FID': number;
  'Scout email': string;
  'Scout display name': string;
  'Scout farcaster name': string;
  'Scout path': string;
  'Moxie fan tokens': number;
  'Moxie sent': boolean;
  'Moxie tokens earned': number;
};

export async function getMoxieCandidates({ week }: { week: ISOWeek }): Promise<MoxieBonusRow[]> {
  const season = getCurrentSeasonStart(week);

  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      farcasterId: {
        not: null
      },
      hasMoxieProfile: true,
      userWeeklyStats: {
        some: {
          week,
          gemsCollected: {
            gt: 0
          }
        }
      },
      deletedAt: null
    },
    orderBy: {
      farcasterId: 'asc'
    },
    select: {
      id: true,
      farcasterId: true,
      path: true,
      builderNfts: {
        where: {
          season
        },
        select: {
          nftSoldEvents: {
            select: {
              scout: {
                select: {
                  farcasterId: true,
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });

  const moxiePartnerRewardEvents = await prisma.partnerRewardEvent.findMany({
    where: {
      week,
      partner: 'moxie',
      season
    },
    orderBy: {
      userId: 'asc'
    },
    select: {
      user: {
        select: {
          farcasterId: true,
          id: true
        }
      }
    }
  });
  const moxiePartnerRewardEventUserFids = moxiePartnerRewardEvents.map((e) => e.user.farcasterId);
  const scoutMoxieAmounts: Record<string, MoxieBonusRow> = {};

  await Promise.all(
    builders.map(async (builder) => {
      const builderFid = builder.farcasterId as number;
      const scoutsFids = builder.builderNfts
        .map((nft) => nft.nftSoldEvents.map((e) => e.scout.farcasterId))
        .flat()
        .filter((scoutFid) => scoutFid) as number[];

      for (const scoutFid of uniq(scoutsFids)) {
        const fanTokenAmount = await getMoxieFanTokenAmount({
          builderFid,
          scoutFid
        });
        if (fanTokenAmount) {
          const scout = await prisma.scout.findUnique({
            where: {
              farcasterId: scoutFid!
            },
            select: {
              id: true,
              email: true,
              displayName: true,
              farcasterName: true,
              path: true
            }
          });
          if (!scoutMoxieAmounts[scoutFid]) {
            scoutMoxieAmounts[scoutFid] = {
              'Scout ID': scout?.id || '',
              'Scout FID': scoutFid,
              'Scout email': scout?.email || '',
              'Scout display name': scout?.displayName || '',
              'Scout farcaster name': scout?.farcasterName || '',
              'Scout path': scout?.path || '',
              'Moxie fan tokens': 0,
              'Moxie tokens earned': 0,
              'Moxie sent': moxiePartnerRewardEventUserFids.includes(scoutFid)
            };
          }
          scoutMoxieAmounts[scoutFid]['Moxie fan tokens'] += 1;
        }
      }
    })
  );

  Object.values(scoutMoxieAmounts).forEach((row) => {
    row['Moxie tokens earned'] = row['Moxie fan tokens'] * 2000;
  });

  return Object.values(scoutMoxieAmounts);
}

async function getMoxieFanTokenAmount({
  builderFid,
  scoutFid
}: {
  builderFid: number;
  scoutFid: number;
}): Promise<number> {
  const query = `
    query GetPortfolioInfo {
      MoxieUserPortfolios(
        input: {
          filter: {
            fid: {_eq: "${scoutFid}"},
            fanTokenSymbol: {
              # Fan Token to check, symbol will be based on types:
              # - User: fid:<FID>
              # - Channel: cid:<CHANNEL-ID>
              # - Network: id:farcaster
              _eq: "fid:${builderFid}"
            }
          }
        }
      ) {
        MoxieUserPortfolio {
          amount: totalUnlockedAmount
        }
      }
    }
  `;
  const data = await airstackRequest<{
    data: { MoxieUserPortfolios: { MoxieUserPortfolio: { amount: number }[] | null } };
  }>(query);
  const amount = data.data.MoxieUserPortfolios.MoxieUserPortfolio?.[0]?.amount || 0;
  return amount;
}
