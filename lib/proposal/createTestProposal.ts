import { prisma } from '@charmverse/core/prisma-client';

import { MAX_EMBED_WIDTH } from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { Constants } from 'lib/focalboard/constants';

import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  CREATED_AT_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID
} from './blocks/constants';
import { createProposal } from './createProposal';

export async function createTestProposal({
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
      title: 'Test Proposal',
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
      }
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
        [Constants.titleColumnId]: 'Test Proposal'
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
