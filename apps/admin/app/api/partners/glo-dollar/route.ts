import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const scouts = await prisma.scout.findMany({
    where: {
      nftPurchaseEvents: {
        some: {
          builderEvent: {
            week: lastWeek,
            season: currentSeason
          }
        }
      },
      deletedAt: null,
      wallets: {
        some: {}
      }
    },
    select: {
      displayName: true,
      path: true,
      wallets: {
        select: {
          address: true
        }
      },
      nftPurchaseEvents: {
        select: {
          tokensPurchased: true
        },
        where: {
          builderEvent: {
            week: lastWeek,
            season: currentSeason
          }
        }
      }
    }
  });

  const sortedScouts = scouts
    .map((scout) => {
      const purchaseCount = scout.nftPurchaseEvents.reduce((acc, curr) => acc + curr.tokensPurchased, 0);

      return {
        displayName: scout.displayName,
        purchaseCount,
        path: scout.path,
        wallet: scout.wallets[0].address
      };
    })
    .sort((a, b) => b.purchaseCount - a.purchaseCount);

  const rows = sortedScouts.map(({ displayName, path, wallet, purchaseCount }) => ({
    'User Name': displayName,
    'Profile Link': `https://scoutgame.xyz/u/${path}`,
    'Wallet Address': wallet,
    'Purchase Count': purchaseCount
  }));

  return respondWithTSV(rows, `partners-export_glo_dollar_${lastWeek}.tsv`);
}
