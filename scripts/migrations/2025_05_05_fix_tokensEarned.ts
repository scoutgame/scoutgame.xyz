import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { formatUnits } from 'viem';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function query() {
  const stats = await prisma.userSeasonStats.findMany({
    where: {
      season: getCurrentSeasonStart(),
      pointsEarnedAsScout: {
        gt: 0
      }
      // user: {
      //   path: 'mattcasey'
      // }
    }
  });
  console.log('stats', stats.length);

  for (const stat of stats) {
    const scout = await prisma.scout.findFirstOrThrow({
      where: {
        id: stat.userId
      },
      include: {
        wallets: {
          include: {
            tokensReceived: {
              include: {
                event: true
              }
            }
          }
        },
        userSeasonStats: {
          where: {
            season: getCurrentSeasonStart()
          }
        }
      }
    });
    const scoutTotal = scout.wallets.reduce((acc, wallet) => {
      return (
        acc +
        wallet.tokensReceived
          .filter((e) => e.event.type !== 'gems_payout' || e.event.builderId !== scout.id)
          .reduce((_acc, token) => _acc + BigInt(token.value), BigInt(0))
      );
    }, BigInt(0));
    const devTotal = scout.wallets.reduce((acc, wallet) => {
      return (
        acc +
        wallet.tokensReceived
          .filter((e) => e.event.type === 'gems_payout' && e.event.builderId === scout.id)
          .reduce((_acc, token) => _acc + BigInt(token.value), BigInt(0))
      );
    }, BigInt(0));
    //prettyPrint(scout);
    // console.log('total', total.toString(), total / BigInt(1e18));
    const pointsEarnedAsScout = parseInt(formatUnits(scoutTotal, 18));
    const pointsEarnedAsDev = parseInt(formatUnits(devTotal, 18));
    console.log(scout.path, 'pointsEarnedAsScout / pointsEarnedAsDev', pointsEarnedAsScout, pointsEarnedAsDev);
    await prisma.userSeasonStats.update({
      where: {
        userId_season: {
          userId: scout.id,
          season: getCurrentSeasonStart() //getCurrentWeek()
        }
      },
      data: {
        pointsEarnedAsScout: Number(formatUnits(scoutTotal, 18))
      }
    });
    await prisma.userAllTimeStats.upsert({
      where: {
        userId: scout.id
      },
      create: {
        pointsEarnedAsScout: pointsEarnedAsScout,
        user: {
          connect: {
            id: scout.id
          }
        }
      },
      update: {
        pointsEarnedAsScout: pointsEarnedAsScout
      }
    });
  }
}
query();
