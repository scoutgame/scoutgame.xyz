import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { isTruthy } from '@packages/utils/types';
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
            where: {
              ...validMintNftPurchaseEvent,
              // builderNft: {
              //   nftType: 'default'
              // },
              builderEvent: {
                week: {
                  lte: week
                }
              }
            },
            select: {
              scoutWallet: {
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

  const scoutIds = new Set(
    builders
      .flatMap((b) => b.builderNfts.flatMap((nft) => nft.nftSoldEvents.map((e) => e.scoutWallet!.scout.farcasterId)))
      .filter(isTruthy)
  );

  log.debug(`Processing ${scoutIds.size} scouts from ${builders.length} builders on Moxie`);

  // retrieve balances from Moxie API
  const scoutBalances = await Promise.all(
    Array.from(scoutIds).map(async (scoutFid) => {
      const balances = await getMoxieFanTokenAmounts({ scoutFid });
      return { scoutFid, balances };
    })
  );

  await Promise.all(
    builders.map(async (builder) => {
      const builderFid = builder.farcasterId as number;
      const scoutsFids = uniq(
        builder.builderNfts
          .map((nft) => nft.nftSoldEvents.map((e) => e.scoutWallet!.scout.farcasterId))
          .flat()
          .filter((scoutFid) => scoutFid)
      ) as number[];

      for (const scoutFid of scoutsFids) {
        const fanTokenAmount = scoutBalances.find((record) => record.scoutFid === scoutFid)?.balances[builderFid];
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

// source: https://docs.airstack.xyz/airstack-docs-and-faqs/moxie/moxie-fan-token-balances#check-if-certain-user-hold-certain-fan-token
async function getMoxieFanTokenAmounts({ scoutFid }: { scoutFid: number }): Promise<Record<string, number>> {
  const query = `
    query GetPortfolioInfo {
      MoxieUserPortfolios(
        input: {
          filter: {
            fid: {_eq: "${scoutFid}"}
          }
        }
      ) {
        MoxieUserPortfolio {
          amount: totalUnlockedAmount
          fanTokenSymbol
        }
      }
    }
  `;
  const response = await airstackRequest<{
    errors?: { message: string; path: any[] }[];
    data: { MoxieUserPortfolios: null | { MoxieUserPortfolio: { amount: number; fanTokenSymbol: string }[] | null } };
  }>(query);
  if (response.errors?.length) {
    log.warn('Errors fetching Moxie fan token balances', { scoutFid, errors: response.errors });
    throw new Error(`Errors fetching Moxie fan token balances: ${response.errors[0].message}`);
  } else if (response.data.MoxieUserPortfolios === null) {
    log.warn('No Moxie fan token balances found', { scoutFid, response });
    return {};
  }
  return (response.data.MoxieUserPortfolios.MoxieUserPortfolio || []).reduce<Record<string, number>>((acc, curr) => {
    // fanTokenSymbol examples: "fid:2600",  "cid:mfers"
    const symbolParts = curr.fanTokenSymbol.split(':');
    if (symbolParts[0] === 'fid') {
      acc[symbolParts[1]] = curr.amount;
    }
    return acc;
  }, {});
}
