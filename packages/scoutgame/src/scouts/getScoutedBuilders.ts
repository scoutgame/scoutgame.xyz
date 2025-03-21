import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';

import type { BuilderInfo } from '../builders/interfaces';
import { normalizeLast14DaysRank } from '../builders/utils/normalizeLast14DaysRank';
import { scoutTokenDecimals } from '../protocol/constants';

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        season: getCurrentSeasonStart()
      },
      scoutWallet: {
        scoutId
      }
    },
    select: {
      tokensPurchased: true,
      builderNft: {
        select: {
          builderId: true,
          nftType: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.builderNft.builderId)));

  const builders = await prisma.scout.findMany({
    where: {
      id: {
        in: uniqueBuilderIds
      },
      deletedAt: null
    },
    select: {
      ...BasicUserInfoSelect,
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          level: true
        }
      },
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          contractAddress: true,
          imageUrl: true,
          currentPrice: true,
          currentPriceInScoutToken: true,
          nftType: true,
          nftSoldEvents: {
            where: {
              walletAddress: {
                not: null
              }
            },
            include: {
              scoutWallet: {
                select: {
                  scoutId: true
                }
              }
            }
          },
          congratsImageUrl: true,
          estimatedPayout: true,
          estimatedPayoutInScoutToken: true
        }
      },
      builderCardActivities: {
        select: {
          last14Days: true
        }
      },
      builderStatus: true,
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          gemsCollected: true
        }
      }
    }
  });

  return builders.flatMap((builder) => {
    return builder.builderNfts
      .map((nft) => {
        const nftsSoldData = nft.nftSoldEvents.reduce(
          (acc, event) => {
            acc.total += event.tokensPurchased;
            if (event.scoutWallet?.scoutId === scoutId) {
              acc.toScout += event.tokensPurchased;
            }
            return acc;
          },
          { total: 0, toScout: 0 }
        );

        if (nftsSoldData.toScout === 0) {
          return null;
        }

        const nftData: BuilderInfo = {
          id: builder.id,
          nftImageUrl: nft.imageUrl,
          path: builder.path,
          displayName: builder.displayName,
          builderStatus: builder.builderStatus!,
          nftsSoldToScout: nftsSoldData.toScout,
          price: isOnchainPlatform() ? BigInt(nft.currentPriceInScoutToken ?? 0) : (nft.currentPrice ?? BigInt(0)),
          last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
          nftType: nft.nftType,
          gemsCollected: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
          congratsImageUrl: nft.congratsImageUrl,
          estimatedPayout: isOnchainPlatform()
            ? Number(BigInt(nft.estimatedPayoutInScoutToken ?? 0) / BigInt(10 ** scoutTokenDecimals))
            : (nft.estimatedPayout ?? 0),
          level: builder.userSeasonStats[0]?.level ?? 0
        };

        return nftData;
      })
      .filter((nft) => nft !== null) as BuilderInfo[];
  });
}
