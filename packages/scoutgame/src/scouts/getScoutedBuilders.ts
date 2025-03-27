import { prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';
import { isTruthy } from '@packages/utils/types';
import type { Address } from 'viem';

import type { BuilderInfo } from '../builders/interfaces';
import { normalizeLast14DaysRank } from '../builders/utils/normalizeLast14DaysRank';
import { devTokenDecimals } from '../protocol/constants';

export async function getScoutedBuilders({
  loggedInScoutId,
  scoutIdInView
}: {
  loggedInScoutId?: string;
  scoutIdInView: string;
}): Promise<BuilderInfo[]> {
  const scoutIds = [loggedInScoutId, scoutIdInView].filter(isTruthy);
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
          currentPriceDevToken: true,
          nftType: true,
          congratsImageUrl: true,
          estimatedPayout: true,
          estimatedPayoutDevToken: true,
          listings: {
            select: {
              id: true,
              price: true,
              priceDevToken: true,
              order: true,
              seller: {
                select: {
                  scoutId: true
                }
              }
            }
          }
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

        const isOnchain = isOnchainPlatform();

        const price = isOnchain ? BigInt(nft.currentPriceDevToken ?? 0) : BigInt(nft.currentPrice ?? 0);

        const nftData: BuilderInfo = {
          id: builder.id,
          nftImageUrl: nft.imageUrl,
          path: builder.path,
          displayName: builder.displayName,
          builderStatus: builder.builderStatus!,
          nftsSoldToScoutInView,
          nftsSoldToLoggedInScout,
          price,
          last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
          nftType: nft.nftType,
          gemsCollected: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
          congratsImageUrl: nft.congratsImageUrl,
          estimatedPayout: isOnchain
            ? (Number(BigInt(nft.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals)) ?? 0)
            : (nft.estimatedPayout ?? 0),
          level: builder.userSeasonStats[0]?.level ?? 0,
          listings: nft.listings.map(({ seller, ...listing }) => ({
            ...listing,
            scoutId: seller.scoutId,
            price: isOnchain ? BigInt(listing.priceDevToken || 0) : listing.price || BigInt(0),
            order: listing.order as OrderWithCounter,
            contractAddress: nft.contractAddress as Address
          }))
        };

        return nftData;
      })
      .filter(isTruthy);
  });
}
