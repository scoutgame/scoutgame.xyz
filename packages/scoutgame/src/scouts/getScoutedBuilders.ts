import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import type { BuilderInfo } from '../builders/interfaces';
import { normalizeLast14DaysRank } from '../builders/utils/normalizeLast14DaysRank';
import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId, devTokenDecimals } from '../protocol/constants';

async function getScoutedBuildersUsingProtocolBuilderNfts({
  scoutIdInView,
  loggedInScoutId
}: {
  scoutIdInView: string;
  loggedInScoutId?: string;
}): Promise<BuilderInfo[]> {
  const scoutIds = [loggedInScoutId, scoutIdInView].filter(isTruthy);

  const scoutedNfts = await prisma.scoutNft.findMany({
    where: {
      scoutWallet: {
        scoutId: scoutIdInView
      },
      builderNft: {
        chainId: scoutProtocolChainId,
        contractAddress: scoutProtocolBuilderNftContractAddress
      }
    },
    select: {
      balance: true,
      builderNft: {
        select: {
          tokenId: true
        }
      },
      scoutWallet: {
        select: {
          scoutId: true
        }
      }
    }
  });

  // Get unique builder token IDs since multiple wallets may own the same NFT
  const uniqueTokenIds = Array.from(new Set(scoutedNfts.map((nft) => nft.builderNft.tokenId)));

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
          currentPriceDevToken: true,
          nftType: true,
          tokenId: true,
          congratsImageUrl: true,
          estimatedPayoutDevToken: true,
          nftOwners:
            scoutIds.length > 0
              ? {
                  where: {
                    scoutWallet: {
                      scoutId: {
                        in: scoutIds
                      }
                    }
                  }
                }
              : undefined
        }
      }
    }
  });

  return builders
    .map((builder) => {
      const nftsSoldToLoggedInScout = scoutedNfts.find((s) => s.scoutWallet.scoutId === loggedInScoutId)?.balance || 0;
      const nftsSoldToScoutInView =
        loggedInScoutId === scoutIdInView
          ? 0 // dont show this number if scout is looking at their own profile
          : scoutedNfts.find((s) => s.scoutWallet.scoutId === scoutIdInView)?.balance || 0;
      if (nftsSoldToScoutInView === 0 || loggedInScoutId === scoutIdInView) {
        return null;
      }
      return {
        ...builder,
        nftImageUrl: builder.builderNfts[0].imageUrl,
        nftType: builder.builderNfts[0].nftType,
        congratsImageUrl: builder.builderNfts[0].congratsImageUrl,
        price: BigInt(builder.builderNfts[0].currentPriceDevToken ?? 0),
        level: builder.userSeasonStats[0]?.level ?? 0,
        estimatedPayout:
          Number(BigInt(builder.builderNfts[0].estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals)) ?? 0,
        last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
        nftsSoldToScoutInView,
        nftsSoldToLoggedInScout
      };
    })
    .filter(isTruthy);
}

export async function getScoutedBuilders({
  loggedInScoutId,
  scoutIdInView
}: {
  loggedInScoutId?: string;
  scoutIdInView: string;
}): Promise<BuilderInfo[]> {
  const scoutIds = [loggedInScoutId, scoutIdInView].filter(isTruthy);
  if (isOnchainPlatform()) {
    return getScoutedBuildersUsingProtocolBuilderNfts({ scoutIdInView, loggedInScoutId });
  }

  const scoutedNfts = await prisma.scoutNft.findMany({
    where: {
      scoutWallet: {
        scoutId: {
          in: scoutIds
        }
      },
      builderNft: {
        season: getCurrentSeasonStart()
      }
    },
    select: {
      balance: true,
      builderNft: {
        select: {
          id: true,
          builderId: true,
          nftType: true
        }
      },
      scoutWallet: {
        select: {
          scoutId: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(scoutedNfts.map((nft) => nft.builderNft.builderId)));

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
          season: getCurrentSeasonStart(),
          id: {
            in: scoutedNfts.map((nft) => nft.builderNft.id)
          }
        },
        select: {
          contractAddress: true,
          imageUrl: true,
          currentPrice: true,
          nftType: true,
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
    const nftsSoldToLoggedInScout = scoutedNfts
      .filter((s) => s.builderNft.builderId === builder.id && s.scoutWallet.scoutId === loggedInScoutId)
      .reduce((acc, nft) => acc + nft.balance, 0);

    return builder.builderNfts
      .map((nft) => {
        const nftsSoldToScoutInView =
          loggedInScoutId === scoutIdInView
            ? 0 // dont show this number if scout is looking at their own profile
            : scoutedNfts
                .filter(
                  (s) =>
                    s.builderNft.builderId === builder.id &&
                    s.builderNft.nftType === nft.nftType &&
                    s.scoutWallet.scoutId === scoutIdInView
                )
                .reduce((acc, _nft) => acc + _nft.balance, 0);

        if (nftsSoldToScoutInView === 0 && loggedInScoutId !== scoutIdInView) {
          return null;
        }

        const nftData: BuilderInfo = {
          id: builder.id,
          nftImageUrl: nft.imageUrl,
          path: builder.path,
          displayName: builder.displayName,
          builderStatus: builder.builderStatus!,
          nftsSoldToScoutInView,
          nftsSoldToLoggedInScout,
          price: nft.currentPrice ?? BigInt(0),
          last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
          nftType: nft.nftType,
          gemsCollected: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
          congratsImageUrl: nft.congratsImageUrl,
          estimatedPayout: nft.estimatedPayout ?? 0,
          level: builder.userSeasonStats[0]?.level ?? 0
        };

        return nftData;
      })
      .filter(isTruthy);
  });
}
