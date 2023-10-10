/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { publicPermissionsClient } from 'lib/permissions/api/client';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createVoteNotification } from '../saveNotification';

export async function createPollNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  switch (webhookData.event.scope) {
    case WebhookEventNames.VoteCreated: {
      const voteId = webhookData.event.vote.id;
      const vote = await prisma.vote.findUniqueOrThrow({
        where: {
          id: voteId,
          status: 'InProgress'
        },
        include: {
          page: {
            select: { id: true, path: true, title: true }
          },
          post: {
            include: { category: true }
          },
          space: {
            select: {
              id: true,
              name: true,
              domain: true,
              paidTier: true
            }
          },
          userVotes: true,
          voteOptions: true,
          author: true
        }
      });

      const spaceId = vote.space.id;
      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          id: true,
          userId: true
        }
      });

      const spaceUserIds = spaceRoles.map(({ userId }) => userId).filter((userId) => userId !== vote.author.id);

      if (vote.page) {
        for (const spaceUserId of spaceUserIds) {
          const pagePermission =
            vote.space.paidTier === 'free'
              ? await publicPermissionsClient.pages.computePagePermissions({
                  resourceId: vote.page.id,
                  userId: spaceUserId
                })
              : await premiumPermissionsApiClient.pages.computePagePermissions({
                  resourceId: vote.page.id,
                  userId: spaceUserId
                });
          if (pagePermission.comment && vote.author.id !== spaceUserId) {
            await createVoteNotification({
              createdBy: vote.author.id,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
          }
        }
      } else if (vote.post) {
        for (const spaceUserId of spaceUserIds) {
          const categories =
            vote.space.paidTier === 'free'
              ? await publicPermissionsClient.forum.getPermissionedCategories({
                  postCategories: [vote.post.category],
                  userId: spaceUserId
                })
              : await premiumPermissionsApiClient.forum.getPermissionedCategories({
                  postCategories: [vote.post.category],
                  userId: spaceUserId
                });

          if (categories.length !== 0 && categories[0].permissions.comment_posts && vote.author.id !== spaceUserId) {
            await createVoteNotification({
              createdBy: vote.author.id,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
          }
        }
      }

      break;
    }

    default:
      break;
  }
}
