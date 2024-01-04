import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalReviewer } from '@charmverse/core/prisma';
import type { FormField, Proposal, ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

import { getProposalEvaluationStatus } from './getProposalEvaluationStatus';
import type {
  ProposalEvaluationStep,
  ProposalFields,
  ProposalWithUsersAndRubric,
  ProposalWithUsersLite
} from './interface';

type FormFieldsIncludeType = {
  form: {
    id: string;
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal({
  proposal,
  permissions,
  canAccessPrivateFormFields
}: {
  proposal: Proposal &
    FormFieldsIncludeType & {
      evaluations: (ProposalEvaluation & {
        reviewers: ProposalReviewer[];
        rubricAnswers: any[];
        draftRubricAnswers: any[];
      })[];
      rewards: { id: string }[];
      reviewers: ProposalReviewer[];
      rubricAnswers: any[];
      draftRubricAnswers: any[];
    };
  permissions?: ProposalPermissionFlags;
  canAccessPrivateFormFields?: boolean;
}): ProposalWithUsersAndRubric {
  const { rewards, form, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const formFields = getProposalFormFields(form?.formFields, !!canAccessPrivateFormFields);
  const fields = (rest.fields as ProposalFields) ?? null;

  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getProposalEvaluationStatus({
      evaluations: proposal.evaluations,
      hasPendingRewards: (fields.pendingRewards ?? []).length > 0,
      hasRewards: rewards.length > 0,
      status: proposal.status
    }),
    // Support old model: filter out evaluation-specific reviewers and rubric answers
    rubricAnswers: currentEvaluation?.rubricAnswers || proposal.rubricAnswers,
    draftRubricAnswers: currentEvaluation?.draftRubricAnswers || proposal.draftRubricAnswers,
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null,
    form: form
      ? {
          formFields: formFields || null,
          id: form?.id || null
        }
      : null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
export function mapDbProposalToProposalLite({
  proposal,
  permissions
}: {
  proposal: ProposalWithUsers & {
    evaluations: (ProposalEvaluation & { reviewers: ProposalReviewer[] })[];
    rewards: { id: string }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersLite {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const fields = (rest.fields as ProposalFields) ?? null;
  const hasRewards = rewards.length > 0 || (fields.pendingRewards ?? []).length > 0;
  const isLastEvaluation = currentEvaluation?.index === proposal.evaluations.length - 1;

  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluation:
      proposal.status === 'draft'
        ? {
            title: 'Draft',
            step: 'draft' as ProposalEvaluationStep
          }
        : currentEvaluation
        ? isLastEvaluation && hasRewards
          ? {
              title: 'Rewards',
              step: 'rewards' as ProposalEvaluationStep
            }
          : {
              title: currentEvaluation.title,
              step: currentEvaluation.type
            }
        : undefined,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getProposalEvaluationStatus({
      evaluations: proposal.evaluations,
      hasPendingRewards: (fields.pendingRewards ?? []).length > 0,
      status: proposal.status,
      hasRewards: rewards.length > 0
    }),
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null,
    fields
  };

  return proposalWithUsers;
}
