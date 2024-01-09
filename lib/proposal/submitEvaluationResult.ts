import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { createVoteIfNecessary } from './createVoteIfNecessary';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
};

export async function submitEvaluationResult({
  decidedBy,
  evaluationId,
  proposalId,
  result,
  spaceId
}: ReviewEvaluationRequest & {
  spaceId: string;
}) {
  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      result,
      decidedBy,
      completedAt: new Date()
    }
  });

  await publishProposalEvent({
    currentEvaluationId: evaluationId,
    proposalId,
    scope: WebhookEventNames.ProposalStatusChanged,
    spaceId,
    userId: decidedBy
  });

  // determine if we should create vote for the next stage
  if (result === 'pass') {
    await createVoteIfNecessary({
      createdBy: decidedBy,
      proposalId
    });
  }
}
