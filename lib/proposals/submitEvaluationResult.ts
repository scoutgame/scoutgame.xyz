import type { ProposalEvaluationResult, ProposalEvaluationType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { issueOffchainProposalCredentialsIfNecessary } from 'lib/credentials/issueOffchainProposalCredentialsIfNecessary';
import { ActionNotPermittedError } from 'lib/middleware';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
  declineReasons?: string[];
};

export async function updatePassFailEvaluationResultIfRequired({
  currentEvaluationType,
  evaluationId,
  proposalId,
  requiredReviews,
  spaceId,
  userId
}: {
  evaluationId: string;
  proposalId: string;
  requiredReviews?: number;
  userId: string;
  spaceId: string;
  currentEvaluationType?: ProposalEvaluationType;
}) {
  if (currentEvaluationType === 'pass_fail') {
    const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluationId
      },
      select: {
        result: true
      }
    });

    if (existingEvaluationReviews.length === requiredReviews) {
      await updateEvaluationResult({
        decidedBy: userId,
        evaluationId,
        existingEvaluationReviews,
        proposalId,
        spaceId
      });
    }
  }
}

async function updateEvaluationResult({
  decidedBy,
  evaluationId,
  existingEvaluationReviews,
  proposalId,
  result,
  spaceId
}: {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result?: ProposalEvaluationResult;
  existingEvaluationReviews: { result: ProposalEvaluationResult }[];
  spaceId: string;
}) {
  const totalPassed = existingEvaluationReviews.filter((r) => r.result === 'pass').length + (result === 'pass' ? 1 : 0);
  const totalFailed = existingEvaluationReviews.filter((r) => r.result === 'fail').length + (result === 'fail' ? 1 : 0);
  const finalResult = totalPassed > totalFailed ? 'pass' : 'fail';

  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      result: finalResult,
      decidedBy,
      completedAt: new Date()
    }
  });

  await setPageUpdatedAt({ proposalId, userId: decidedBy });

  await publishProposalEvent({
    currentEvaluationId: evaluationId,
    proposalId,
    spaceId,
    userId: decidedBy
  });

  // determine if we should create vote for the next stage
  if (finalResult === 'pass') {
    await createVoteIfNecessary({
      createdBy: decidedBy,
      proposalId
    });
    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId
    });
  }
}

export async function submitEvaluationResult({
  decidedBy,
  proposalId,
  result,
  spaceId,
  evaluation,
  declineReasons
}: Omit<ReviewEvaluationRequest, 'evaluationId'> & {
  spaceId: string;
  evaluation: { id: string; type: ProposalEvaluationType; title: string; requiredReviews: number };
}) {
  const evaluationId = evaluation.id;
  const requiredReviews = evaluation.requiredReviews;
  const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
    where: {
      evaluationId
    },
    select: {
      result: true,
      reviewerId: true
    }
  });

  const hasCurrentReviewerReviewed = existingEvaluationReviews.some((r) => r.reviewerId === decidedBy);
  if (hasCurrentReviewerReviewed) {
    throw new ActionNotPermittedError('You have already reviewed this evaluation');
  }

  if (evaluation.type === 'pass_fail') {
    await prisma.proposalEvaluationReview.create({
      data: {
        evaluationId,
        result,
        reviewerId: decidedBy,
        declineReasons
      }
    });
  }

  if (existingEvaluationReviews.length + 1 === requiredReviews) {
    await updateEvaluationResult({
      decidedBy,
      proposalId,
      evaluationId,
      result,
      existingEvaluationReviews,
      spaceId
    });
  }
}
