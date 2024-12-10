import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { airstackRequest } from '@packages/scoutgame/moxie/airstackRequest';
import { uniq } from 'lodash';
import { v4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      farcasterId: {
        not: null
      },
      hasMoxieProfile: true,
      userWeeklyStats: {
        some: {
          week: lastWeek,
          gemsCollected: {
            gt: 0
          }
        }
      }
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
          season: currentSeason
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

  if (builders.length === 0) {
    log.info('No builders found', { lastWeek, currentSeason });
    return new Response('No builders found', { status: 204 });
  }

  const moxiePartnerRewardEvents = await prisma.partnerRewardEvent.findMany({
    where: {
      week: lastWeek,
      partner: 'moxie',
      season: currentSeason
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
  const scoutMoxieAmounts: Record<
    number,
    {
      fid: number;
      userId: string;
      amount: number;
    }
  > = {};

  await Promise.all(
    builders.map(async (builder) => {
      const builderFid = builder.farcasterId as number;
      const scoutsFids = builder.builderNfts
        .map((nft) => nft.nftSoldEvents.map((e) => e.scout.farcasterId))
        .flat()
        .filter((scoutFid) => scoutFid && !moxiePartnerRewardEventUserFids.includes(scoutFid)) as number[];

      for (const scoutFid of uniq(scoutsFids)) {
        const fanTokenAmount = await getMoxieFanTokenAmount({
          builderFid,
          scoutFid
        });
        if (fanTokenAmount) {
          if (!scoutMoxieAmounts[scoutFid]) {
            scoutMoxieAmounts[scoutFid] = {
              fid: scoutFid,
              amount: 0,
              userId: builder.id
            };
          }
          scoutMoxieAmounts[scoutFid].amount += 1;
        }
      }
    })
  );

  if (Object.values(scoutMoxieAmounts).length === 0) {
    log.info('No moxie amounts found', { lastWeek, currentSeason });
    return new Response('No moxie amounts found', { status: 204 });
  }

  try {
    await fetch(`https://rewards.moxie.xyz/partners/${process.env.MOXIE_PARTNER_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MOXIE_API_KEY}`
      },
      body: JSON.stringify({
        id: v4(),
        timestamp: new Date().toISOString(),
        data: Object.values(scoutMoxieAmounts).map(({ fid, amount }) => ({
          fid,
          amount: amount * 2000
        }))
      })
    });

    await prisma.partnerRewardEvent.createMany({
      data: Object.values(scoutMoxieAmounts).map(({ userId, amount }) => ({
        reward: {
          amount: amount * 2000
        },
        week: lastWeek,
        partner: 'moxie',
        season: currentSeason,
        userId
      }))
    });
  } catch (e) {
    log.error('Error posting to moxie', { error: e });
  }

  return new Response('Success', { status: 200 });
}

export async function getMoxieFanTokenAmount({
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
  const data = await airstackRequest(query);
  // console.log('data', data);
  return data.data.MoxieUserPortfolios.MoxieUserPortfolio?.[0]?.amount || 0;
}
