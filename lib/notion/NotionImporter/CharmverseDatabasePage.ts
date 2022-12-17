import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createBoard } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';

import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import { getPersistentImageUrl } from '../getPersistentImageUrl';

import type { DatabasePageItem, NotionCache } from './NotionCache';
import type { NotionPage } from './NotionPage';

export class CharmverseDatabasePage {
  pageIds: string[];

  notionPageId: string;

  cache: NotionCache;

  notionPage: NotionPage;

  charmversePageId: string;

  constructor({
    pageIds,
    notionPageId,
    cache,
    notionPage
  }: {
    pageIds: string[];
    notionPageId: string;
    cache: NotionCache;
    notionPage: NotionPage;
  }) {
    this.cache = cache;
    this.notionPage = notionPage;
    this.pageIds = pageIds;
    this.notionPageId = notionPageId;
    this.charmversePageId = v4();
  }

  async create() {
    const pageRecord = this.cache.pagesRecord.get(this.notionPageId) as DatabasePageItem;
    if (!pageRecord?.charmversePage) {
      const notionPage = this.cache.notionPagesRecord[this.notionPageId] as DatabaseObjectResponse;
      const notionPageTitle = convertToPlainText(notionPage.title);
      const parentPage =
        notionPage.parent.type !== 'workspace'
          ? await this.notionPage.fetchAndCreatePage({
              notionPageId:
                notionPage.parent.type === 'page_id' ? notionPage.parent.page_id : notionPage.parent.block_id
            })
          : null;

      const parentId = parentPage?.id ?? this.notionPage.workspacePageId;
      const board = createBoard();
      const headerImageUrl = notionPage.cover
        ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.notionPage.spaceId })
        : null;

      board.id = this.charmversePageId;
      board.title = notionPageTitle;
      board.fields.icon = notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '';
      board.fields.headerImage = headerImageUrl;
      board.rootId = board.id;
      board.fields.cardProperties = pageRecord.notionPage ? Object.values(pageRecord.notionPage.properties) : [];
      const view = createBoardView();
      view.fields.viewType = 'board';
      view.parentId = board.id;
      view.rootId = board.rootId;
      view.title = 'Board view';

      const commonBlockData = {
        spaceId: this.notionPage.spaceId,
        createdBy: this.notionPage.userId,
        updatedBy: this.notionPage.userId,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Optimistically create the page
      const createdCharmversePage = await createPrismaPage({
        id: this.charmversePageId,
        headerImage: headerImageUrl,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
        spaceId: this.notionPage.spaceId,
        type: 'board',
        createdBy: this.notionPage.userId,
        title: notionPageTitle,
        parentId,
        boardId: board.id
      });

      await prisma.block.createMany({
        data: [
          {
            ...view,
            ...commonBlockData
          },
          {
            ...board,
            ...commonBlockData
          }
        ]
      });

      this.cache.pagesRecord.set(this.notionPageId, {
        ...pageRecord,
        type: 'database',
        charmversePage: createdCharmversePage
      });

      const pageIds = pageRecord.notionPage?.pageIds ?? [];
      for (const pageId of pageIds) {
        await this.notionPage.fetchAndCreatePage({
          notionPageId: pageId
        });
      }

      return createdCharmversePage;
    } else {
      return pageRecord.charmversePage;
    }
  }
}
