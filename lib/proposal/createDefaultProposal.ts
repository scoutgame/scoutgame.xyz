import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { MAX_EMBED_WIDTH } from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { Constants } from 'lib/focalboard/constants';

import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID
} from './blocks/constants';
import type { ProposalEvaluationInput } from './createProposal';
import { createProposal } from './createProposal';
import { defaultWorkflowTitle } from './workflows/defaultWorkflows';

export const defaultProposalTitle = 'Getting Started';

const voteSettings: ProposalEvaluationInput['voteSettings'] = {
  threshold: 50,
  type: 'Approval',
  options: ['Yes', 'No', 'Abstain'],
  maxChoices: 1,
  publishToSnapshot: false,
  durationDays: 5
};
// replace the old method with this one once we have moved to new flow
export async function createDefaultProposal({ spaceId, userId }: { spaceId: string; userId: string }) {
  const workflow = await prisma.proposalWorkflow.findFirstOrThrow({
    where: {
      spaceId,
      title: defaultWorkflowTitle
    }
  });

  await createProposal({
    spaceId,
    userId,
    authors: [userId],
    evaluationType: 'vote',
    publishToLens: false,
    rubricCriteria: [],
    workflowId: workflow.id,
    evaluations: workflow.evaluations.map(
      (evaluation: any, index) =>
        ({
          ...evaluation,
          id: uuid(),
          index,
          reviewers: [{ systemRole: 'space_member' }],
          voteSettings: evaluation.type === 'vote' ? voteSettings : null
        } as ProposalEvaluationInput)
    ) as ProposalEvaluationInput[],
    pageProps: {
      headerImage: null,
      icon: null,
      sourceTemplateId: null,
      contentText: '',
      type: 'proposal',
      title: defaultProposalTitle,
      content: {
        type: 'doc',
        content: [
          {
            type: 'iframe',
            attrs: {
              type: 'embed',
              src: 'https://tiny.charmverse.io/proposal-builder',
              width: MAX_EMBED_WIDTH,
              height: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
            }
          }
        ]
      },
      autoGenerated: true
    },
    fields: {
      properties: {
        [AUTHORS_BLOCK_ID]: [userId],
        [CREATED_AT_ID]: '',
        [EVALUATION_TYPE_BLOCK_ID]: 'vote',
        [PROPOSAL_REVIEWERS_BLOCK_ID]: [
          {
            group: 'user',
            id: userId
          }
        ],
        [STATUS_BLOCK_ID]: 'draft',
        [Constants.titleColumnId]: 'Getting Started'
      }
    },
    reviewers: [
      {
        group: 'user',
        id: userId
      }
    ]
  });
}
