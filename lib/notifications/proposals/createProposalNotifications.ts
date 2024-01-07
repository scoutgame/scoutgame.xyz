/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposalAction } from 'lib/proposal/getProposalAction';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import type { NotificationToggles } from '../notificationToggles';
import { saveProposalNotification } from '../saveNotification';

export async function createProposalNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.ProposalStatusChanged: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;
      const currentEvaluationId = webhookData.event.currentEvaluationId;

      if (!currentEvaluationId) {
        break;
      }

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          createdBy: true,
          categoryId: true,
          evaluations: {
            include: {
              reviewers: true
            },
            orderBy: {
              index: 'asc'
            }
          },
          fields: true,
          rewards: {
            select: {
              id: true
            }
          },
          status: true,
          authors: {
            select: {
              userId: true
            }
          },
          page: {
            select: {
              deletedAt: true
            }
          }
        }
      });

      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      const isProposalDeleted = proposal.page?.deletedAt;

      if (!currentEvaluation || isProposalDeleted) {
        break;
      }

      const proposalAuthorIds = proposal.authors.map(({ userId: authorId }) => authorId);

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          domain: true,
          name: true,
          paidTier: true,
          notificationToggles: true
        }
      });

      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          userId: true,
          id: true
        }
      });

      for (const spaceRole of spaceRoles) {
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }
        const proposalPermission = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: proposalId,
          userId: spaceRole.userId
        });

        if (!proposalPermission.view) {
          continue;
        }

        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer = proposalPermission.review || proposalPermission.evaluate;
        const isVoter = proposalPermission.vote;
        const canComment = proposalPermission.comment;
        const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];
        const previousEvaluation =
          currentEvaluation?.index && currentEvaluation.index > 0 && currentEvaluation.id !== lastEvaluation.id
            ? proposal.evaluations[currentEvaluation.index - 1]
            : null;

        const action = getProposalAction({
          isAuthor,
          isReviewer,
          isVoter,
          proposal,
          canComment
        });

        if (!action) {
          continue;
        }

        // check notification preferences
        const notificationToggles = space.notificationToggles as NotificationToggles;
        if (notificationToggles[`proposals__${action}`] === false) {
          continue;
        }

        const { id } = await saveProposalNotification({
          createdAt: webhookData.createdAt,
          createdBy: userId,
          proposalId,
          spaceId,
          userId: spaceRole.userId,
          type: action,
          evaluationId: action === 'step_failed' && previousEvaluation ? previousEvaluation.id : currentEvaluation.id
        });
        ids.push(id);
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
