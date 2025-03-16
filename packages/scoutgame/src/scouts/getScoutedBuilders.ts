import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';
import { DateTime } from 'luxon';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import type { BuilderInfo } from '../builders/interfaces';
import { normalizeLast14DaysRank } from '../builders/utils/normalizeLast14DaysRank';
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
        contractAddress: scoutProtocolBuilderNftContractAddress
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
          contractAddress: scoutProtocolBuilderNftContractAddress
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
          level: true
        }
      },
      builderCardActivities: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart(),
          contractAddress: scoutProtocolBuilderNftContractAddress
        },
        select: {
          contractAddress: true,
          imageUrl: true,
          currentPrice: true,
          currentPriceInScoutToken: true,
          nftType: true,
          tokenId: true,
          congratsImageUrl: true,
          estimatedPayout: true,
          nftSoldEvents: scoutId
            ? {
                where: {
                  builderEvent: {
                    season: getCurrentSeasonStart()
                  },
                  ...validMintNftPurchaseEvent,
                  scoutWallet: {
                    scoutId
                  }
                },
                select: {
                  tokensPurchased: true
                }
              }
            : undefined
        }
      }
    }
  });

  return builders.map((builder) => ({
    ...builder,
    nftImageUrl: builder.builderNfts[0].imageUrl,
    nftType: builder.builderNfts[0].nftType,
    congratsImageUrl: builder.builderNfts[0].congratsImageUrl,
    price: isOnchainPlatform()
      ? BigInt(builder.builderNfts[0].currentPriceInScoutToken ?? 0)
      : (builder.builderNfts[0].currentPrice ?? BigInt(0)),
    level: builder.userSeasonStats[0]?.level ?? 0,
    estimatedPayout: builder.builderNfts[0]?.estimatedPayout ?? 0,
    last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
    nftsSoldToScout: builder.builderNfts[0].nftSoldEvents.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0)
  }));
}

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  if (isOnchainPlatform()) {
    return getScoutedBuildersUsingProtocolBuilderNfts({ scoutId });
  }

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
          estimatedPayout: true
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
          estimatedPayout: nft.estimatedPayout ?? 0,
          level: builder.userSeasonStats[0]?.level ?? 0
        };

        return nftData;
      })
      .filter((nft) => nft !== null) as BuilderInfo[];
  });
}
