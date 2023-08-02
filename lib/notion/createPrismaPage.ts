import type { Prisma } from '@charmverse/core/prisma';

import { getPagePath } from 'lib/pages';
import { createPage } from 'lib/pages/server/createPage';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';

import type { CreatePageInput } from './types';

export async function createPrismaPage({
  id,
  content = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  },
  headerImage = null,
  icon,
  spaceId,
  title,
  type = 'page',
  createdBy,
  boardId,
  parentId,
  cardId
}: CreatePageInput) {
  const pageCreateInput: Prisma.PageCreateInput = {
    id,
    content,
    // TODO: Generate content text
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: createdBy
      }
    },
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: getPagePath(),
    space: {
      connect: {
        id: spaceId || undefined
      }
    },
    autoGenerated: true,
    headerImage,
    icon,
    title: title || '',
    type,
    boardId,
    parentId
  };

  if (type === 'card' && cardId) {
    pageCreateInput.card = {
      connect: {
        id: cardId
      }
    };
  }

  // eslint-disable-next-line
  let page = await createPage({ data: pageCreateInput });

  await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
    event: 'created',
    pageId: page.id
  });

  return page;
}
