'use server';

import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
import { DateTime } from 'luxon';

import { devTokenDecimals } from '../protocol/constants';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

type DeveloperCardInfo = {
  estimatedPayout: number;
  price: bigint;
  cardsSold: number;
  cardsSoldToScout: number;
  nftImageUrl: string;
  congratsImageUrl: string | null;
};

export type DeveloperInfo = {
  id: string;
  path: string;
  displayName: string;
  avatar: string;
  firstContributionDate: Date;
  level: number;
  starterCard: DeveloperCardInfo;
  regularCard: DeveloperCardInfo;
  rank: number;
  cardsSold: number;
  gemsCollected: number;
  githubConnectedAt: Date;
  githubLogin: string;
  farcasterUsername: string | null;
  seasonPoints: number;
  scoutedBy: number;
  githubActivities: {
    repo: string;
    owner: string;
    url: string;
    gems: number;
    createdAt: Date;
    avatar?: string | null;
  }[];
  last14DaysRank: (number | null)[];
};

export async function getDeveloperInfo({
  path,
  scoutId
}: {
  path: string;
  scoutId?: string;
}): Promise<DeveloperInfo | null> {
  if (typeof path !== 'string') {
    log.error('Path is not a string when looking for developer info', { path, scoutId });
    return null;
  }
  const season = getCurrentSeasonStart();
  const week = getCurrentWeek();
  const oneMonthAgo = DateTime.now().minus({ months: 1 }).toJSDate();

  const developer = await prisma.scout.findUnique({
    where: {
      path,
      builderStatus: {
        in: ['approved', 'banned']
      },
      githubUsers: {
        some: {}
      }
    },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      path: true,
      createdAt: true,
      farcasterName: true,
      githubUsers: {
        select: {
          login: true,
          createdAt: true
        }
      },
      userSeasonStats: {
        where: {
          season
        },
        select: {
          level: true,
          nftsSold: true,
          nftOwners: true,
          pointsEarnedAsBuilder: true
        }
      },
      userWeeklyStats: {
        where: {
          week
        },
        select: {
          rank: true,
          gemsCollected: true
        }
      },
      builderCardActivities: {
        select: {
          last14Days: true
        }
      },
      builderNfts: {
        where: {
          season
        },
        select: {
          estimatedPayout: true,
          estimatedPayoutDevToken: true,
          currentPrice: true,
          currentPriceDevToken: true,
          imageUrl: true,
          congratsImageUrl: true,
          nftType: true,
          nftOwners: {
            where: {
              scoutWallet: {
                scout: {
                  deletedAt: null
                }
              }
            },
            select: {
              balance: true,
              scoutWallet: {
                select: {
                  scoutId: true
                }
              }
            }
          }
        }
      },
      events: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 3,
        where: {
          createdAt: {
            gt: oneMonthAgo
          },
          type: {
            in: ['merged_pull_request', 'daily_commit']
          }
        },
        select: {
          createdAt: true,
          gemsReceipt: {
            select: {
              value: true
            }
          },
          githubEvent: {
            select: {
              url: true,
              repo: {
                select: {
                  name: true,
                  owner: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!developer) {
    return null;
  }

  const firstContributionDate = await prisma.githubEvent.findFirst({
    where: {
      builderEvent: {
        builderId: developer.id
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true
    }
  });

  const regularCard = developer.builderNfts.find((nft) => nft.nftType === BuilderNftType.default);
  const starterCard = developer.builderNfts.find((nft) => nft.nftType === BuilderNftType.starter_pack);

  if (!regularCard) {
    log.error('No regular or starter card found', {
      developerId: developer.id
    });

    throw new Error('No regular card found for developer');
  }

  if (!starterCard) {
    log.error('No starter card found', {
      developerId: developer.id
    });

    throw new Error('No starter card found for developer');
  }

  const regularCardsSold = regularCard.nftOwners.reduce((acc, nftOwner) => acc + nftOwner.balance, 0);
  const starterCardsSold = starterCard.nftOwners.reduce((acc, nftOwner) => acc + nftOwner.balance, 0);

  const regularCardsSoldToScout = regularCard.nftOwners
    .filter((nftOwner) => nftOwner.scoutWallet.scoutId === scoutId)
    .reduce((acc, nftOwner) => acc + nftOwner.balance, 0);
  const starterCardsSoldToScout = starterCard.nftOwners
    .filter((nftOwner) => nftOwner.scoutWallet.scoutId === scoutId)
    .reduce((acc, nftOwner) => acc + nftOwner.balance, 0);

  return {
    id: developer.id,
    path: developer.path,
    avatar: developer.avatar as string,
    displayName: developer.displayName,
    firstContributionDate: firstContributionDate?.createdAt || developer.createdAt,
    level: developer.userSeasonStats[0]?.level || 0,
    cardsSold: developer.userSeasonStats[0]?.nftsSold || 0,
    scoutedBy: developer.userSeasonStats[0]?.nftOwners || 0,
    rank: developer.userWeeklyStats[0]?.rank || 0,
    gemsCollected: developer.userWeeklyStats[0]?.gemsCollected || 0,
    githubConnectedAt: developer.githubUsers[0].createdAt,
    githubLogin: developer.githubUsers[0].login,
    farcasterUsername: developer.farcasterName || null,
    seasonPoints: developer.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    githubActivities: developer.events
      .filter((event) => event.githubEvent && event.gemsReceipt)
      .map((event) => ({
        createdAt: event.createdAt,
        avatar: event.githubEvent!.repo.avatar,
        gems: event.gemsReceipt!.value,
        url: event.githubEvent!.url,
        repo: event.githubEvent!.repo.name,
        owner: event.githubEvent!.repo.owner
      })),
    last14DaysRank: normalizeLast14DaysRank(developer.builderCardActivities[0]),
    starterCard: {
      estimatedPayout: isOnchainPlatform()
        ? Number(BigInt(starterCard.estimatedPayoutDevToken || 0) / BigInt(10 ** devTokenDecimals))
        : starterCard.estimatedPayout || 0,
      price: isOnchainPlatform()
        ? BigInt(starterCard.currentPriceDevToken || 0)
        : BigInt(starterCard.currentPrice || 0),
      cardsSold: starterCardsSold,
      cardsSoldToScout: starterCardsSoldToScout,
      nftImageUrl: starterCard.imageUrl,
      congratsImageUrl: starterCard.congratsImageUrl || null
    },
    regularCard: {
      estimatedPayout: isOnchainPlatform()
        ? Number(BigInt(regularCard.estimatedPayoutDevToken || 0) / BigInt(10 ** devTokenDecimals))
        : regularCard.estimatedPayout || 0,
      price: isOnchainPlatform()
        ? BigInt(regularCard.currentPriceDevToken || 0)
        : BigInt(regularCard.currentPrice || 0),
      cardsSold: regularCardsSold,
      cardsSoldToScout: regularCardsSoldToScout,
      nftImageUrl: regularCard.imageUrl,
      congratsImageUrl: regularCard.congratsImageUrl || null
    }
  };
}
