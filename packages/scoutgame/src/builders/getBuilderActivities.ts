import type { GemsReceiptType, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isTruthy } from '@packages/utils/types';

import type { BonusPartner } from '../bonus';
import { validMintNftPurchaseEvent } from '../builderNfts/constants';

export type BuilderActivityType = 'nft_purchase' | 'merged_pull_request';

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

export type BuilderActivity = Pick<Scout, 'id' | 'createdAt' | 'displayName' | 'path' | 'avatar' | 'bio'> & {
  githubLogin?: string;
} & (NftPurchaseActivity | MergedPullRequestActivity);

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
            in: ['merged_pull_request', 'daily_commit']
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
          type: 'nft_purchase' as const,
          scout: {
            path: event.nftPurchaseEvent.scoutWallet!.scout.path,
            displayName: event.nftPurchaseEvent.scoutWallet!.scout.displayName
          }
        };
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
          type: 'github_event' as const,
          contributionType: event.gemsReceipt.type,
          gems: event.gemsReceipt.value,
          repo: `${event.githubEvent.repo.owner}/${event.githubEvent.repo.name}`,
          url: event.githubEvent.url,
          bonusPartner: event.bonusPartner as BonusPartner | null
        };
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
