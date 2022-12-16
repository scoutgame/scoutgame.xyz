import { v4 } from 'uuid';

import { prisma } from 'db';

import { createPrismaPage } from '../createPrismaPage';
import type { GetDatabaseResponse, GetPageResponse } from '../types';

import type { NotionCache } from './NotionCache';
import type { NotionPageFetcher } from './NotionPageFetcher';

export class CharmversePageCreator {
  createdCharmversePageIds: Set<string> = new Set();

  cache: NotionCache;

  fetcher: NotionPageFetcher;

  constructor({ cache, fetcher }: { fetcher: NotionPageFetcher; cache: NotionCache }) {
    this.cache = cache;
    this.fetcher = fetcher;
  }

  async createCharmversePageFromNotionPage(
    workspacePageId: string,
    rootParentId: string,
    _block: GetPageResponse | GetDatabaseResponse
  ) {
    const { createCharmversePage, createdCharmversePageIds, createCharmverseDatabasePage } = this;

    const { blocksRecord, failedImportsRecord, notionPagesRecord, charmversePagesRecord, charmverseCardsRecord } =
      this.cache;

    let totalUngroupedPages = 0;

    async function recurse(block: GetPageResponse | GetDatabaseResponse) {
      const failedToImportBlock = failedImportsRecord[block.id] && failedImportsRecord[block.id].blocks.length === 0;
      if (!failedToImportBlock) {
        // pages and databases
        if (block.parent.type === 'page_id') {
          // Create its parent first, parent could be regular page or database pages
          if (!createdCharmversePageIds.has(block.parent.page_id) && notionPagesRecord[block.parent.page_id]) {
            await recurse(notionPagesRecord[block.parent.page_id]);
          }
          let parentId = null;
          const failedToImportParent =
            failedImportsRecord[block.parent.page_id] && failedImportsRecord[block.parent.page_id].blocks.length === 0;
          if (failedToImportParent) {
            totalUngroupedPages += 1;
            parentId = rootParentId;
          }
          // If the parent was created successfully
          // Or if we failed to import some blocks from the parent (partial success)
          else if (notionPagesRecord[block.parent.page_id] && createdCharmversePageIds.has(block.parent.page_id)) {
            // Check if the parent is a regular page first
            // If its not then the parent is a database page (focalboard card)
            parentId =
              charmversePagesRecord[block.parent.page_id]?.id ?? charmverseCardsRecord[block.parent.page_id]?.page?.id;
          } else {
            // Parent id could be a block, for example there could be a nested page inside a callout/quote/column block
            // Here parent.page_id is not actually the the id of the page, its the id of the nearest parent of the page, which could be callout/quote/column block
            parentId = charmversePagesRecord[blocksRecord[block.parent.page_id]?.pageId]?.id ?? rootParentId;
          }

          if (block.object === 'database') {
            await createCharmverseDatabasePage(block.id, parentId);
          } else if (block.object === 'page') {
            await createCharmversePage(block.id, parentId);
          }
        }
        // Focalboard cards
        // If the card has been created (in memory) and the database has been created in memory
        else if (
          block.parent.type === 'database_id' &&
          charmverseCardsRecord[block.id] &&
          charmversePagesRecord[block.parent.database_id]
        ) {
          // If the parent wasn't created create it first if there were no errors
          if (!createdCharmversePageIds.has(block.parent.database_id) && notionPagesRecord[block.parent.database_id]) {
            await recurse(notionPagesRecord[block.parent.database_id]);
          }
          // Make sure the database page has not failed to be created, otherwise no cards will be added
          const { notionPageId, page, card } = charmverseCardsRecord[block.id];
          if (
            !failedImportsRecord[block.parent.database_id] &&
            createdCharmversePageIds.has(block.parent.database_id)
          ) {
            await prisma.block.create({
              data: card
            });
            // Creating the page corresponding to the card
            await createCharmversePage(notionPageId, page.parentId);
          }
          // If the database wasn't imported then the cards cant be created, so add them to failedImportRecord
          else {
            failedImportsRecord[notionPageId] = {
              blocks: [],
              pageId: notionPageId,
              title: card.title,
              type: 'page'
            };
          }
        }
        // Top level pages and databases
        else if (block.parent.type === 'workspace') {
          if (block.object === 'database') {
            await createCharmverseDatabasePage(block.id, workspacePageId);
          } else if (block.object === 'page') {
            await createCharmversePage(block.id, workspacePageId);
          }
        }
      }
    }

    await recurse(_block);

    return totalUngroupedPages;
  }

  async create({
    spaceId,
    userId,
    workspaceIcon,
    workspaceName
  }: {
    workspaceIcon: string;
    spaceId: string;
    workspaceName: string;
    userId: string;
  }) {
    const workspacePage = await createPrismaPage({
      id: v4(),
      icon: workspaceIcon,
      spaceId,
      title: workspaceName,
      createdBy: userId
    });

    const ungroupedPageInput = {
      id: v4(),
      icon: null,
      spaceId,
      title: 'Ungrouped',
      createdBy: userId,
      parentId: workspacePage.id
    };

    let totalUngroupedPages = 0;
    const createdCharmversePageIds: Set<string> = new Set();

    for (let index = 0; index < this.cache.notionPages.length; index++) {
      const notionPage = this.cache.notionPages[index];
      // check if we already created the page and skip
      if (
        (notionPage?.object === 'database' || notionPage?.object === 'page') &&
        !createdCharmversePageIds.has(notionPage.id)
      ) {
        totalUngroupedPages += await this.createCharmversePageFromNotionPage(
          workspacePage.id,
          ungroupedPageInput.id,
          notionPage
        );
      }
    }

    if (totalUngroupedPages > 0) {
      await createPrismaPage(ungroupedPageInput);
    }
  }
}
