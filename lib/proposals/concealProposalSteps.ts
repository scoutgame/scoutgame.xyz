import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getAssignedRoleIds } from 'lib/roles/getAssignedRoleIds';
import { prettyPrint } from 'lib/utils/strings';

import type { PopulatedEvaluation, ProposalWithUsersAndRubric } from './interfaces';

const privateEvaluationSteps: ProposalEvaluationType[] = ['rubric', 'pass_fail', 'vote'];

type MinimalProposal = Pick<ProposalWithUsersAndRubric, 'spaceId' | 'workflowId' | 'id'> & {
  evaluations: (Pick<ProposalWithUsersAndRubric['evaluations'][0], 'id' | 'type' | 'result' | 'index' | 'reviewers'> &
    Partial<ProposalWithUsersAndRubric['evaluations'][0]>)[];
};

export async function concealProposalSteps<T extends MinimalProposal = MinimalProposal>({
  proposal,
  userId,
  applicableRoleIds,
  isAdmin
}: {
  proposal: T;
  userId?: string;
  applicableRoleIds?: string[];
  isAdmin?: boolean;
}) {
  if (!proposal.workflowId) {
    return proposal;
  }

  const workflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: proposal.workflowId
    },
    select: {
      privateEvaluations: true
    }
  });

  if (!workflow) {
    return proposal;
  }

  // Search conditions allowing for early exit without needing to conceal the evaluation steps
  if (userId) {
    const _isAdmin =
      typeof isAdmin === 'boolean'
        ? isAdmin
        : await hasAccessToSpace({
            spaceId: proposal.spaceId,
            userId
          }).then((data) => !!data.isAdmin);

    if (_isAdmin) {
      return proposal;
    }

    const applicableRoles = applicableRoleIds ?? (await getAssignedRoleIds({ spaceId: proposal.spaceId, userId }));

    const isReviewer = proposal.evaluations.some(
      (evaluation) =>
        privateEvaluationSteps.includes(evaluation.type as ProposalEvaluationType) &&
        evaluation.reviewers.some(
          (reviewer) =>
            (!!reviewer.userId && reviewer.userId === userId) ||
            (!!reviewer.roleId && applicableRoles?.includes(reviewer.roleId))
        )
    );

    if (isReviewer) {
      return proposal;
    }
  }

  const stepsWithCollapsedEvaluations: MinimalProposal['evaluations'][number][] = [];

  for (let i = 0; i < proposal.evaluations.length; i++) {
    const previousStep = stepsWithCollapsedEvaluations[stepsWithCollapsedEvaluations.length - 1];
    const currentStep = proposal.evaluations[i];

    const isConcealableEvaluation = privateEvaluationSteps.includes(currentStep.type as ProposalEvaluationType);

    if (!isConcealableEvaluation) {
      stepsWithCollapsedEvaluations.push(currentStep);
    } else if (previousStep?.type !== 'private_evaluation') {
      stepsWithCollapsedEvaluations.push({
        completedAt: null,
        decidedBy: null,
        draftRubricAnswers: [],
        id: currentStep.id,
        index: currentStep.index,
        permissions: [],
        proposalId: proposal.id,
        result: currentStep.result,
        reviewers: [],
        rubricAnswers: [],
        rubricCriteria: [],
        snapshotExpiry: null,
        snapshotId: null,
        title: 'Evaluation',
        type: 'private_evaluation',
        voteId: null,
        voteSettings: null,
        actionLabels: null,
        isReviewer: false
      });
    } else if (previousStep.result) {
      previousStep.id = currentStep.id;
      previousStep.result = currentStep.result;
    }
  }

  proposal.evaluations = stepsWithCollapsedEvaluations;

  prettyPrint({
    stepsWithCollapsedEvaluations: stepsWithCollapsedEvaluations.map((s) => ({
      id: s.id,
      result: s.result,
      type: s.type
    }))
  });

  return proposal;
}
