import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import type { NextRouter } from 'next/router';
import { mutate } from 'swr';
import { v4 } from 'uuid';

import charmClient from 'charmClient';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getPagesListCacheKey } from 'hooks/usePages';
import { emitSocketMessage } from 'hooks/useWebSocketClient';
import type { Board } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { createTableView } from 'lib/focalboard/table';

import { getPagePath } from './utils';

export type NewPageInput = Partial<Page> & {
  spaceId: string;
  createdBy: string;
};

interface AddPageResponse {
  board: Board | null;
  view: BoardView | null;
  cards: Card[];
  page: PageWithPermissions;
}

type CreatedPage = Omit<AddPageResponse, 'page'> & { page: Pick<Page, 'id' | 'path'> };

export async function addPage({ createdBy, spaceId, ...page }: NewPageInput, cb?: (page: CreatedPage) => void) {
  const pageId = page?.id || v4();

  const isBoardPage = page.type?.match(/board/);
  const pageProperties: Partial<Page> = {
    id: pageId,
    boardId: isBoardPage ? pageId : undefined,
    content: undefined,
    contentText: '',
    createdAt: new Date(),
    createdBy,
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: getPagePath(),
    spaceId,
    title: '',
    type: 'page',
    ...page
  };

  if (page.type === 'board' || page.type === 'page') {
    emitSocketMessage({
      type: 'page_created',
      payload: pageProperties
    });

    /* (createdPage) => {
      const result: AddPageResponse = {
        board: null,
        page: newPage,
        cards: [],
        view: null
      };
  
      if (isBoardPage) {
        const { board } = createDefaultBoardData({ boardId: pageId });
        result.board = board;
        await mutator.insertBlocks([board]);
      }
  
      await mutate(
        getPagesListCacheKey(spaceId),
        (pages: Record<string, Page> | undefined) => {
          return { ...pages, [newPage.id]: newPage };
        },
        {
          // revalidate pages for board since we create 3 default ones
          revalidate: Boolean(isBoardPage)
        }
      );
      if (cb) {
        cb(createdPage)
      }
    } */
  } else {
    const newPage = await charmClient.createPage(pageProperties);
    await mutate(
      getPagesListCacheKey(spaceId),
      (pages: Record<string, Page> | undefined) => {
        return { ...pages, [newPage.id]: newPage };
      },
      {
        // revalidate pages for board since we create 3 default ones
        revalidate: Boolean(isBoardPage)
      }
    );
  }
}

interface DefaultBoardProps {
  boardId: string;
}

function createDefaultBoardData({ boardId }: DefaultBoardProps) {
  const board = createBoard();
  board.id = boardId;
  board.rootId = board.id;

  const view = createTableView({ board, views: [] });

  return {
    board,
    view,
    cards: []
  };
}

export async function addPageAndRedirect(page: NewPageInput, router: NextRouter) {
  if (page) {
    await addPage(page, (newPage) => {
      router.push(`/${router.query.domain}/${newPage.page.path}`);
    });
  }
}
