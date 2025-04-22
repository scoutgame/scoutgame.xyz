import type { GemsReceiptType, OnchainAchievementTier, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isTruthy } from '@packages/utils/types';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import type { BonusPartner } from '../partnerRewards/constants';

export type BuilderActivityType = 'nft_purchase' | 'merged_pull_request';

const builderEventTypes = ['merged_pull_request', 'daily_commit', 'onchain_achievement'] as const;

type NftPurchaseActivity = {
  type: 'nft_purchase';
  scout: {
    path: string;
    displayName: string;
  };
};

type MergedPullRequestActivity = {
  type: 'github_event';
  contributionType: GemsReceiptType;
  gems: number;
  repo: string;
  url: string;
  bonusPartner: BonusPartner | null;
};

export type OnchainAchievementActivity = {
  type: 'onchain_achievement';
  project: {
    name: string;
    path: string;
  };
  gems: number;
  tier: OnchainAchievementTier;
};

type AnyActivity = NftPurchaseActivity | MergedPullRequestActivity | OnchainAchievementActivity;

export type BuilderActivity<T = AnyActivity> = Pick<
  Scout,
  'id' | 'createdAt' | 'displayName' | 'path' | 'avatar' | 'bio'
> & {
  githubLogin?: string;
} & T;

export async function getBuilderActivities({
  builderId,
  limit = 10
}: {
  builderId?: string;
  limit: number;
}): Promise<BuilderActivity[]> {
  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      builder: {
        id: builderId,
        builderStatus: 'approved',
        deletedAt: null
      },
      OR: [
        {
          type: {
            in: [...builderEventTypes]
          }
        },
        {
          type: 'nft_purchase',
          nftPurchaseEvent: validMintNftPurchaseEvent
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    select: {
      builder: {
        select: BasicUserInfoSelect
      },
      bonusPartner: true,
      id: true,
      createdAt: true,
      type: true,
      onchainAchievement: {
        select: {
          project: {
            select: {
              name: true,
              path: true
            }
          },
          tier: true
        }
      },
      nftPurchaseEvent: {
        select: {
          scoutWallet: {
            select: {
              scout: {
                select: {
                  id: true,
                  path: true,
                  displayName: true
                }
              }
            }
          },
          tokensPurchased: true
        }
      },
      gemsReceipt: {
        select: {
          type: true,
          value: true
        }
      },
      githubEvent: {
        select: {
          url: true,
          repo: {
            select: {
              name: true,
              owner: true
            }
          }
        }
      }
    }
  });

  return builderEvents
    .map((event) => {
      if (event.type === 'nft_purchase' && event.nftPurchaseEvent) {
        return {
          ...event.builder,
          path: event.builder.path,
          id: event.id,
          createdAt: event.createdAt,
          type: 'nft_purchase',
          scout: {
            path: event.nftPurchaseEvent.scoutWallet!.scout.path,
            displayName: event.nftPurchaseEvent.scoutWallet!.scout.displayName
          }
        } as BuilderActivity<NftPurchaseActivity>;
      } else if (
        (event.type === 'merged_pull_request' || event.type === 'daily_commit') &&
        event.githubEvent &&
        event.gemsReceipt
      ) {
        return {
          ...event.builder,
          path: event.builder.path!,
          id: event.id,
          createdAt: event.createdAt,
          type: 'github_event',
          contributionType: event.gemsReceipt.type,
          gems: event.gemsReceipt.value,
          repo: `${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}`,
          url: event.githubEvent.url,
          bonusPartner: event.bonusPartner as BonusPartner | null
        } as BuilderActivity<MergedPullRequestActivity>;
      } else if (event.type === 'onchain_achievement' && event.onchainAchievement) {
        return {
          ...event.builder,
          path: event.builder.path!,
          id: event.id,
          createdAt: event.createdAt,
          type: 'onchain_achievement',
          project: {
            name: event.onchainAchievement.project.name,
            path: event.onchainAchievement.project.path
          },
          tier: event.onchainAchievement.tier,
          gems: event.gemsReceipt?.value || 0
        } as BuilderActivity<OnchainAchievementActivity>;
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
