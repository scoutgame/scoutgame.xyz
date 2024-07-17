import { prisma } from '@charmverse/core/prisma-client';

import type { BlockWithDetails } from 'lib/databases/block';
import type { Board, BoardFields } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';
import { filterLockedDatabaseCards } from 'lib/databases/filterLockedDatabaseCards';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { getBlocksAndRefresh } from 'lib/databases/proposalsSource/getBlocks';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { DataNotFoundError } from 'lib/utils/errors';
import { isTruthy } from 'lib/utils/types';

export async function getSubtree({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      id: pageId
    },
    select: {
      boardId: true,
      cardId: true,
      spaceId: true,
      isLocked: true
    }
  });

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.read !== true) {
    throw new DataNotFoundError('Page not found');
  }

  const blockId = page.boardId || page.cardId;
  if (!blockId) {
    throw new DataNotFoundError('Block not found');
  }

  const { blocks } = await getRelatedBlocks(blockId);
  const block = blocks.find((b) => b.id === blockId);

  if (block?.type === 'board') {
    (block as any as Board).isLocked = !!page.isLocked;
  }

  // Hydrate and filter blocks based on proposal permissions
  if (block && (block.fields as BoardFields).sourceType === 'proposals') {
    let result = await getBlocksAndRefresh(block, blocks);

    // Only edit
    if (page.isLocked && block?.type === 'board' && !computed.edit_lock && block) {
      const views = result.filter((b) => b.type === 'view');
      const cards = result.filter((b) => b.type === 'card');
      const filteredCards = filterLockedDatabaseCards({
        board: block as any as Board,
        views: views as any as BoardView[],
        cards: cards as any as Card[]
      });

      result = [block, ...(views as any as BlockWithDetails[]), ...(filteredCards as any as BlockWithDetails[])];
    }

    return result;
  } else {
    const permissionsById = await permissionsApiClient.pages.bulkComputePagePermissions({
      pageIds: blocks.map((b) => b.pageId).filter(isTruthy),
      userId
    });

    // Remember to allow normal blocks that do not have a page, like views, to be shown
    let filtered = blocks.filter((b) => typeof b.pageId === 'undefined' || !!permissionsById[b.pageId]?.read);

    // Only edit
    if (page.isLocked && block?.type === 'board' && !computed.edit_lock && block) {
      const views = filtered.filter((b) => b.type === 'view');
      const cards = filtered.filter((b) => b.type === 'card');
      const filteredCards = filterLockedDatabaseCards({
        board: block as any as Board,
        views: views as any as BoardView[],
        cards: cards as any as Card[]
      });

      filtered = [block, ...(views as any as BlockWithDetails[]), ...(filteredCards as any as BlockWithDetails[])];
    }

    return filtered;
  }
}
