import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function getScoutStats(scoutId: string) {
  const season = getCurrentSeasonStart();
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: scoutId
    },
    select: {
      userSeasonStats: {
        where: {
          season
        },
        select: {
          pointsEarnedAsScout: true,
          nftsPurchased: true
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsScout: true
        }
      },
      wallets: {
        select: {
          scoutedNfts: {
            where: {
              builderNft: {
                season
              }
            },
            select: {
              builderNft: {
                select: {
                  builderId: true
                }
              }
            }
          }
        }
      }
    }
  });

  return {
    allTimeTokens: scout.userAllTimeStats[0]?.pointsEarnedAsScout,
    seasonTokens: scout.userSeasonStats[0]?.pointsEarnedAsScout,
    nftsPurchased: scout.userSeasonStats[0]?.nftsPurchased,
    buildersScouted: new Set(
      scout.wallets.flatMap((wallet) => wallet.scoutedNfts.map((nft) => nft.builderNft.builderId))
    ).size
  };
}
