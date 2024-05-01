import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalNotification } from 'lib/notifications/interfaces';

import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getProposalNotifications({ id, userId }: QueryCondition): Promise<ProposalNotification[]> {
  const proposalNotifications = await prisma.proposalNotification.findMany({
    where: queryCondition({ id, userId }),
    select: {
      id: true,
      type: true,
      proposal: {
        select: {
          status: true,
          evaluations: {
            select: {
              id: true,
              actionButtonLabels: true,
              title: true,
              index: true
            },
            orderBy: {
              index: 'asc'
            }
          },
          page: {
            select: {
              id: true,
              path: true,
              title: true
            }
          }
        }
      },
      evaluation: {
        select: {
          id: true,
          title: true,
          index: true,
          actionButtonLabels: true
        }
      },
      notificationMetadata: {
        select: notificationMetadataSelectStatement
      }
    }
  });

  return proposalNotifications.map((notification) => {
    const page = notification.proposal.page as Page;
    const previousEvaluation = notification.evaluation
      ? notification.proposal.evaluations[notification.evaluation.index - 1]
      : null;
    const proposalNotification = {
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      id: notification.id,
      pageId: page.id,
      pagePath: page.path,
      pageTitle: page.title,
      status: notification.proposal.status,
      createdBy: notification.notificationMetadata.author,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceName: notification.notificationMetadata.space.name,
      spaceId: notification.notificationMetadata.space.id,
      type: notification.type,
      archived: !!notification.notificationMetadata.archivedAt,
      read: !!notification.notificationMetadata.seenAt,
      group: 'proposal',
      evaluation: notification.evaluation
        ? {
            actionButtonLabels: notification.evaluation.actionButtonLabels,
            title: notification.evaluation.title
          }
        : null,
      previousEvaluation: previousEvaluation
        ? {
            title: previousEvaluation.title,
            actionButtonLabels: previousEvaluation.actionButtonLabels
          }
        : null
    } as ProposalNotification;

    return proposalNotification;
  });
}
