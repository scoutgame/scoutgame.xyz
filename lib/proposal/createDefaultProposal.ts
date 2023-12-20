import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { MAX_EMBED_WIDTH } from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { Constants } from 'lib/focalboard/constants';
import { getDefaultFeedbackEvaluation, getDefaultPermissions } from 'lib/proposal/workflows/defaultEvaluation';

import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  CREATED_AT_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID
} from './blocks/constants';
import { createProposal } from './createProposal';

async function createOldDefaultProposal({
  categoryId,
  spaceId,
  userId
}: {
  categoryId?: string;
  spaceId: string;
  userId: string;
}) {
  if (!categoryId) {
    const category = await prisma.proposalCategory.findFirstOrThrow({
      where: {
        spaceId
      },
      select: {
        id: true
      }
    });
    categoryId = category.id;
  }

  await createProposal({
    categoryId,
    spaceId,
    userId,
    authors: [userId],
    evaluationType: 'vote',
    publishToLens: false,
    rubricCriteria: [],
    pageProps: {
      headerImage: null,
      icon: null,
      sourceTemplateId: null,
      contentText: '',
      type: 'proposal',
      title: 'Getting Started',
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
        [CATEGORY_BLOCK_ID]: categoryId,
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
// replace the old method with this one once we have moved to new flow
export async function createDefaultProposal({
  categoryId,
  isCharmVerse,
  spaceId,
  userId
}: {
  categoryId: string;
  isCharmVerse?: boolean;
  spaceId: string;
  userId: string;
}) {
  if (!isCharmVerse) {
    return createOldDefaultProposal({ categoryId, spaceId, userId });
  }
  await createProposal({
    categoryId,
    spaceId,
    userId,
    authors: [userId],
    evaluationType: 'vote',
    publishToLens: false,
    rubricCriteria: [],
    evaluations: [
      {
        index: 0,
        ...getDefaultFeedbackEvaluation(),
        reviewers: [], // reviewers are irrelevant for Feebdack
        rubricCriteria: []
      },
      {
        index: 1,
        id: uuid(),
        title: 'Review',
        type: 'pass_fail',
        reviewers: [{ systemRole: 'space_member' }],
        rubricCriteria: [],
        permissions: getDefaultPermissions()
      }
    ],
    pageProps: {
      headerImage: null,
      icon: null,
      sourceTemplateId: null,
      contentText: '',
      type: 'proposal',
      title: 'Getting Started',
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
        [CATEGORY_BLOCK_ID]: categoryId,
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
