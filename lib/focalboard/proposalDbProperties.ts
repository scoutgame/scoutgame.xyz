import { v4 as uuid } from 'uuid';

import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';
import type { Constants } from 'lib/focalboard/constants';
import type { ProposalEvaluationStatus, ProposalEvaluationStep } from 'lib/proposal/interface';

export const proposalDbProperties: {
  [key in DatabaseProposalPropertyType]: (id?: string, name?: string) => IPropertyTemplate;
} = {
  proposalStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Status',
    options: [],
    type: 'proposalStatus'
  }),
  proposalStep: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Step',
    options: [],
    type: 'proposalStep'
  }),
  proposalUrl: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Url',
    options: [],
    type: 'proposalUrl'
  }),
  proposalEvaluatedBy: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluated By',
    options: [],
    type: 'proposalEvaluatedBy'
  }),
  proposalEvaluationAverage: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Average',
    options: [],
    type: 'proposalEvaluationAverage'
  }),
  proposalEvaluationTotal: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Total',
    options: [],
    type: 'proposalEvaluationTotal'
  }),
  proposalAuthor: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Authors',
    options: [],
    type: 'proposalAuthor'
  }),
  proposalReviewer: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Reviewers',
    options: [],
    type: 'proposalReviewer'
  }),
  proposalEvaluationType: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Type',
    options: [],
    type: 'proposalEvaluationType'
  }),
  proposalCreatedAt: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Created Time',
    options: [],
    type: 'createdTime'
  })
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Declined',
  in_progress: 'In Progress',
  passed: 'Passed',
  published: 'Published',
  unpublished: 'Unpublished'
};

export const PROPOSAL_STATUS_ACTION_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Decline',
  in_progress: 'In Progress',
  passed: 'Pass',
  published: 'Publish',
  unpublished: 'Unpublish'
};

export const PROPOSAL_STEP_LABELS: Record<ProposalEvaluationStep, string> = {
  draft: 'Draft',
  feedback: 'Feedback',
  pass_fail: 'Review',
  rubric: 'Rubric',
  vote: 'Vote',
  rewards: 'Rewards'
};

export const proposalStatusBoardColors: Record<ProposalEvaluationStatus, keyof (typeof Constants)['menuColors']> = {
  complete: 'propColorGreen',
  declined: 'propColorRed',
  in_progress: 'propColorYellow',
  passed: 'propColorGreen',
  published: 'propColorGreen',
  unpublished: 'propColorGray'
};

export const proposalStepBoardColors: Record<ProposalEvaluationStep, keyof (typeof Constants)['menuColors']> = {
  feedback: 'propColorGray',
  pass_fail: 'propColorGray',
  rubric: 'propColorGray',
  vote: 'propColorGray',
  draft: 'propColorGray',
  rewards: 'propColorGray'
};
