import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { v4 as uuid } from 'uuid';

import { getDefaultEvaluation, getDefaultFeedbackEvaluation } from './defaultEvaluation';

export const defaultWorkflowTitle = 'Community Proposals';

export const getDefaultWorkflows: (spaceId: string) => ProposalWorkflowTyped[] = (spaceId) => [
  {
    id: uuid(),
    createdAt: new Date(),
    title: defaultWorkflowTitle,
    evaluations: [
      getDefaultFeedbackEvaluation(),
      getDefaultEvaluation({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluation({
        title: 'Community vote',
        type: 'vote'
      })
    ],
    index: 0,
    spaceId
  },
  {
    id: uuid(),
    createdAt: new Date(),
    title: 'Decision Matrix',
    evaluations: [
      getDefaultEvaluation({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluation({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 1,
    spaceId
  },
  {
    id: uuid(),
    createdAt: new Date(),
    title: 'Grant Applications',
    evaluations: [
      getDefaultEvaluation({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 2,
    spaceId
  }
];
