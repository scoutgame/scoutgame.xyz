import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { getPlatform } from '@packages/mixpanel/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { DateTime } from 'luxon';

import type { BuilderInfo } from '../builders/interfaces';
import { mapGemReceiptsToLast14Days } from '../builders/mapGemReceiptsToLast14Days';
import type { BuilderEventWithGemsReceipt } from '../builders/mapGemReceiptsToLast14Days';
import { normalizeLast14DaysGems } from '../builders/utils/normalizeLast14DaysGems';
import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId } from '../protocol/constants';

async function getScoutedBuildersUsingProtocolBuilderNfts({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const wallets = await prisma.scoutWallet.findMany({
    where: {
      scoutId
    }
  });

  if (wallets.length === 0) {
    log.info('No wallets found for scout', { scoutId });
    return [];
  }

  const scoutedBuilderNfts = await prisma.scoutNft.findMany({
    where: {
      walletAddress: {
        in: wallets.map((wallet) => wallet.address.toLowerCase())
      },
      builderNft: {
        chainId: scoutProtocolChainId,
        contractAddress: scoutProtocolBuilderNftContractAddress()
      }
    },
    include: {
      builderNft: {
        select: {
          tokenId: true
        }
      }
    }
  });

  // Get unique builder token IDs since multiple wallets may own the same NFT
  const uniqueTokenIds = Array.from(new Set(scoutedBuilderNfts.map((nft) => nft.builderNft.tokenId)));

  // Get builder info for each unique token ID
  const builders = await prisma.scout.findMany({
    where: {
      builderNfts: {
        some: {
          tokenId: {
            in: uniqueTokenIds
          },
          chainId: scoutProtocolChainId,
          contractAddress: scoutProtocolBuilderNftContractAddress()
        }
      },
      deletedAt: null
    },
    select: {
      ...BasicUserInfoSelect,
      events: {
        where: {
          createdAt: {
            gte: DateTime.utc().minus({ days: 7 }).toJSDate()
          },
          gemsReceipt: {
            isNot: null
          }
        },
        select: {
          createdAt: true,
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      },
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          nftsSold: true,
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: getCurrentSeasonStart(),
          contractAddress: scoutProtocolBuilderNftContractAddress()
        },
        select: {
          contractAddress: true,
          imageUrl: true,
          currentPrice: true,
          nftType: true,
          tokenId: true,
          congratsImageUrl: true
        }
      }
    }
  });

  return builders.map((builder) => ({
    ...builder,
    nftsSold: builder.userSeasonStats?.[0]?.nftsSold ?? 0,
    nftsSoldToScout: scoutedBuilderNfts.reduce((acc, nft) => {
      if (nft.builderNft.tokenId === builder.builderNfts[0]?.tokenId) {
        acc += nft.balance;
      }
      return acc;
    }, 0),
    nftImageUrl: builder.builderNfts[0].imageUrl,
    nftType: builder.builderNfts[0].nftType,
    congratsImageUrl: builder.builderNfts[0].congratsImageUrl,
    price: builder.builderNfts[0].currentPrice ?? BigInt(0),
    rank: 0, // Would need to calculate this based on some criteria
    builderPoints: builder.userSeasonStats[0].pointsEarnedAsBuilder ?? 0,
    last14DaysGems: mapGemReceiptsToLast14Days({
      events: builder.events as Required<BuilderEventWithGemsReceipt>[],
      currentDate: DateTime.now()
    }).map((gem) => gem.gemsCount)
  }));
}

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  if (getPlatform() === 'onchain_webapp') {
    return getScoutedBuildersUsingProtocolBuilderNfts({ scoutId });
  }

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        season: getCurrentSeasonStart()
      },
      scoutId
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
          nftsSold: true,
          pointsEarnedAsBuilder: true
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
          nftType: true,
          nftSoldEvents: true,
          congratsImageUrl: true
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
          rank: true
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
            if (event.scoutId === scoutId) {
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
          builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
          nftsSold: nftsSoldData.total,
          nftsSoldToScout: nftsSoldData.toScout,
          rank: builder.userWeeklyStats[0]?.rank ?? -1,
          price: nft.currentPrice ?? 0,
          last14DaysGems: normalizeLast14DaysGems(builder.builderCardActivities[0]),
          nftType: nft.nftType,
          congratsImageUrl: nft.congratsImageUrl
        };

        return nftData;
      })
      .filter((nft) => nft !== null) as BuilderInfo[];
  });
}
