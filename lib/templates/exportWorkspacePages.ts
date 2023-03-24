import fs from 'node:fs/promises';
import path from 'node:path';

import type { Block } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';
import type { PageNodeWithChildren } from 'lib/pages';
import { isBoardPageType } from 'lib/pages/isBoardPageType';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { ExportedPage, WorkspaceExport } from './interfaces';

export interface ExportWorkspacePage {
  sourceSpaceIdOrDomain: string;
  exportName?: string;
  rootPageIds?: string[];
  skipBounties?: boolean;
  skipProposals?: boolean;
  skipBountyTemplates?: boolean;
  skipProposalTemplates?: boolean;
}
export async function exportWorkspacePages({
  sourceSpaceIdOrDomain,
  exportName,
  rootPageIds,
  skipBounties = false,
  skipProposals = false,
  skipBountyTemplates = false,
  skipProposalTemplates = false
}: ExportWorkspacePage): Promise<{ data: WorkspaceExport; path?: string }> {
  const isUuid = validate(sourceSpaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUuid ? { id: sourceSpaceIdOrDomain } : { domain: sourceSpaceIdOrDomain }
  });

  if (!space) {
    throw new DataNotFoundError(`Space not found: ${sourceSpaceIdOrDomain}`);
  }

  const rootPages = await prisma.page.findMany({
    where: {
      ...(rootPageIds ? { id: { in: rootPageIds } } : { spaceId: space.id, parentId: null }),
      deletedAt: null
    }
  });

  const exportData: WorkspaceExport = {
    pages: []
  };

  // Replace by multi resolve page tree in future
  const mappedTrees = await Promise.all(
    rootPages.map(async (page) => {
      return resolvePageTree({ pageId: page.id, flattenChildren: true, fullPage: true });
    })
  );

  // Console reporting for manual exports
  // const pageIndexes = mappedTrees.reduce((acc, val) => {
  //   let pageCount = Object.keys(acc).length;

  //   [val.targetPage, ...val.flatChildren].forEach((p) => {
  //     pageCount += 1;
  //     acc[p.id] = pageCount;
  //   });

  //   return acc;
  // }, {} as Record<string, number>);

  /**
   * Mutates the given node to provision its block data
   */
  async function recursiveResolveBlocks({ node }: { node: PageNodeWithChildren<ExportedPage> }): Promise<void> {
    // eslint-disable-next-line no-console
    // console.log('Processing page ', pageIndexes[node.id], ' / ', totalPages);

    if (isBoardPageType(node.type)) {
      const boardblocks = await prisma.block.findMany({
        where: {
          rootId: node.id as string,
          type: {
            in: ['board', 'view']
          }
        }
      });

      node.blocks = {
        board: boardblocks.find((block) => block.type === 'board') as Block,
        views: boardblocks.filter((block) => block.type === 'view') as Block[]
      };
    } else if (node.type.match('card')) {
      const cardBlock = await prisma.block.findFirst({
        where: {
          id: node.id as string,
          type: 'card'
        }
      });

      node.blocks = {
        card: cardBlock as Block
      };
    } else if (
      node.bountyId &&
      ((node.type === 'bounty' && !skipBounties) || (node.type === 'bounty_template' && !skipBountyTemplates))
    ) {
      node.bounty = await prisma.bounty.findUnique({
        where: {
          id: node.bountyId
        },
        include: {
          permissions: true
        }
      });
    } else if (
      node.proposalId &&
      ((node.type === 'proposal' && !skipProposals) || (node.type === 'proposal_template' && !skipProposalTemplates))
    ) {
      node.proposal = await prisma.proposal.findUnique({
        where: {
          id: node.proposalId
        },
        include: {
          category: true
        }
      });
    }

    // node.children = node.children?.filter((child) => !excludedPageTypes.includes(child.type)) ?? [];

    await Promise.all(
      (node.children ?? []).map(async (child) => {
        await recursiveResolveBlocks({ node: child });
      })
    );
    const pollIds: string[] = [];

    if (pollIds.length) {
      node.votes = await prisma.vote.findMany({
        where: {
          id: {
            in: pollIds
          }
        },
        include: {
          voteOptions: true
        }
      });
    }
  }

  await Promise.all(
    mappedTrees.map(async (tree) => {
      await recursiveResolveBlocks({ node: tree.targetPage });
    })
  );

  mappedTrees.forEach((t) => {
    exportData.pages.push(t.targetPage);
  });

  if (!exportName) {
    return {
      data: exportData
    };
  }

  const exportFolder = path.join(__dirname, 'exports');

  try {
    await fs.readdir(exportFolder);
  } catch (err) {
    await fs.mkdir(exportFolder);
  }

  // Continue writing only if an export name was provided
  const exportFilePath = path.join(exportFolder, `${exportName}.json`);

  await fs.writeFile(exportFilePath, JSON.stringify(exportData, null, 2));

  return {
    data: exportData,
    path: exportFilePath
  };
}
