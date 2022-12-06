import type { Prisma } from '@prisma/client';
import { validate } from 'uuid';

import type { TransactionClient } from 'db';
import { prisma } from 'db';

import type { PageMeta } from '../interfaces';

export function pageMetaSelect() {
  return {
    id: true,
    autoGenerated: true,
    boardId: true,
    bountyId: true,
    cardId: true,
    postId: true,
    createdAt: true,
    createdBy: true,
    deletedAt: true,
    fullWidth: true,
    galleryImage: true,
    hasContent: true,
    headerImage: true,
    icon: true,
    index: true,
    isTemplate: true,
    parentId: true,
    path: true,
    proposalId: true,
    snapshotProposalId: true,
    title: true,
    spaceId: true,
    updatedAt: true,
    updatedBy: true,
    type: true,
    permissions: {
      select: {
        id: true,
        pageId: true,
        permissionLevel: true,
        public: true,
        roleId: true,
        spaceId: true,
        userId: true,
        permissions: true
      }
    }
  };
}

export async function getPageMeta(
  pageIdOrPath: string,
  spaceId?: string,
  tx: TransactionClient = prisma
): Promise<PageMeta | null> {
  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid
    ? {
        id: pageIdOrPath
      }
    : {
        path: pageIdOrPath,
        spaceId
      };

  return prisma.page.findFirst({
    where: searchQuery,
    select: pageMetaSelect()
  }) as Promise<PageMeta | null>;
}
