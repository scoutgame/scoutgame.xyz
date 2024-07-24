import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalEvaluationResult,
  ProposalEvaluationType,
  Vote,
  ProposalEvaluationReview,
  ProposalAppealReviewer,
  ProposalEvaluationAppealReview,
  ProposalEvaluationApprover
} from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import type { EASAttestationFromApi } from '@root/lib/credentials/external/getOnchainCredentials';
import type { ProjectWithMembers } from '@root/lib/projects/interfaces';
import type { UpdateableRewardFields } from '@root/lib/rewards/updateRewardSettings';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';

import type { ProposalPropertiesField } from './blocks/interfaces';
import type { DocumentWithSigners } from './documentsToSign/getProposalDocumentsToSign';
import type { ProposalRubricCriteriaAnswerWithTypedResponse, RubricCriteriaTyped } from './rubric/interfaces';

export type ProposalEvaluationStatus = 'in_progress' | 'passed' | 'declined' | 'unpublished' | 'archived';
export type ProposalEvaluationStep = ProposalEvaluationType | 'rewards' | 'credentials' | 'draft';
export type ProposalEvaluationResultExtended = ProposalEvaluationResult | 'in_progress';

export type VoteSettings = Pick<
  Vote,
  'type' | 'threshold' | 'maxChoices' | 'blockNumber' | 'tokenAddress' | 'chainId' | 'strategy'
> & {
  durationDays: number;
  options: string[];
};

export type TypedFormField = Omit<FormField, 'options'> & {
  options: SelectOptionType[];
};

export type ProposalPendingReward = { reward: UpdateableRewardFields; page: NewPageValues; draftId: string };

export type ProposalFields = {
  properties?: ProposalPropertiesField;
  pendingRewards?: ProposalPendingReward[];
  rewardsTemplateId?: string; // require a particular template to be used for rewards
  enableRewards?: boolean; // used by form templates to enable rewards for new proposals
};

export type ConcealableEvaluationType = ProposalEvaluationType | 'private_evaluation';

export type PopulatedEvaluation = Omit<ProposalEvaluation, 'voteSettings' | 'actionLabels' | 'type'> & {
  draftRubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricCriteria: RubricCriteriaTyped[];
  permissions: ProposalEvaluationPermission[];
  reviewers: ProposalReviewer[];
  appealReviewers?: ProposalAppealReviewer[] | null;
  evaluationApprovers?: ProposalEvaluationApprover[] | null;
  voteSettings: VoteSettings | null;
  isReviewer?: boolean; // added by the webapp api
  isAppealReviewer?: boolean; // added by the webapp api
  isApprover?: boolean; // added by webapp api
  requiredReviews: number;
  appealable?: boolean | null;
  appealRequiredReviews?: number | null;
  declineReasonOptions: string[];
  reviews?: ProposalEvaluationReview[];
  appealReviews?: ProposalEvaluationAppealReview[];
  actionLabels?: WorkflowEvaluationJson['actionLabels'];
  notificationLabels?: WorkflowEvaluationJson['notificationLabels'];
  type: ConcealableEvaluationType;
  documentsToSign?: DocumentWithSigners[];
};

export type ProposalWithUsersAndRubric = Omit<Proposal, 'fields'> & {
  authors: ProposalAuthor[];
  rewardIds?: string[] | null;
  evaluations: PopulatedEvaluation[];
  fields: ProposalFields | null;
  page?: Partial<Pick<Page, 'sourceTemplateId' | 'content' | 'contentText' | 'type'>> | null;
  permissions: ProposalPermissionFlags;
  isPublic: boolean;
  currentEvaluationId?: string;
  form: {
    id: string;
    formFields: TypedFormField[] | null;
  } | null;
  project?: ProjectWithMembers | null;
  issuedCredentials: EASAttestationFromApi[];
};
