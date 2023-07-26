import type { Block, Page, PageType, Prisma } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import type { ViewSourceType } from 'lib/focalboard/boardView';
import type { PageWithBlocks } from 'lib/templates/exportWorkspacePages';
import { typedKeys } from 'lib/utilities/objects';

import { pageContentStub } from './generatePageStub';

/**
 * We are currently lacking a way to generate fresh boards purely from the server side (apart from importing them) as this is currently orchestrated by the client-side focal board libraries
 *
 * This function contains a stub which was exported on Sep. 20th 2022 using our exportWorkspacePages method.
 *
 * It contains a top level board, and one level of child cards, all with their own block data necessary to create a new page
 *
 * All spaceId, createdBy, updatedBy, id, parentId, rootId parameters are generated in the body of the stub, except for the cardIds which are generated at the end, to ensure the cardBlock corresponds to the pageId
 *
 */
export function boardWithCardsArgs({
  createdBy,
  spaceId,
  parentId,
  cardCount = 2,
  addPageContent,
  views = 1,
  viewDataSource
}: {
  createdBy: string;
  spaceId: string;
  parentId?: string;
  cardCount?: number;
  addPageContent?: boolean;
  views?: number;
  viewDataSource?: ViewSourceType;
}): { pageArgs: Prisma.PageCreateArgs[]; blockArgs: Prisma.BlockCreateManyArgs } {
  const boardId = v4();

  const cardIds = Array.from({ length: cardCount }).map(() => v4());

  // Skip to the bottom of this file to find the implementation that converts this stub to Prisma arguments

  const rootBoardNode = {
    id: boardId,
    deletedAt: null,
    createdAt: '2022-08-25T17:19:03.909Z',
    createdBy,
    updatedAt: '2022-08-26T09:22:28.912Z',
    updatedBy: createdBy,
    title: 'My blog',
    content: null,
    hasContent: false,
    contentText: '',
    headerImage: null,
    icon: '📝',
    path: `page-${v4()}`,
    isTemplate: false,
    parentId,
    spaceId,
    type: 'board',
    boardId,
    autoGenerated: false,
    index: 0,
    cardId: null,
    snapshotProposalId: null,
    fullWidth: false,
    bountyId: null,
    children: [
      {
        id: cardIds[0],
        deletedAt: null,
        createdAt: '2022-08-25T17:19:05.413Z',
        createdBy,
        updatedAt: '2022-08-26T09:56:33.994Z',
        updatedBy: createdBy,
        title: 'Beer to Web3',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  text: 'Some demo text',
                  type: 'text'
                }
              ]
            }
          ]
        },
        contentText: 'Some demo text. ',
        headerImage: null,
        icon: '🍻',
        path: `page-${v4()}`,
        isTemplate: false,
        parentId: boardId,
        spaceId,
        type: 'card',
        boardId: null,
        autoGenerated: false,
        index: -1,
        snapshotProposalId: null,
        fullWidth: false,
        bountyId: null,
        children: [],
        blocks: {
          card: {
            id: cardIds[0],
            deletedAt: null,
            createdAt: '2022-08-25T17:19:05.413Z',
            createdBy,
            updatedAt: '2022-08-25T17:31:37.646Z',
            updatedBy: createdBy,
            spaceId,
            parentId: boardId,
            rootId: boardId,
            schema: 1,
            type: 'card',
            title: 'Card 3',
            fields: {
              isTemplate: false,
              properties: {
                '01221ad0-94d5-4d88-9ceb-c517573ad765': '{"from":1661169600000}'
              },
              contentOrder: []
            }
          }
        }
      },
      {
        id: cardIds[1],
        deletedAt: null,
        createdAt: '2022-08-25T17:19:05.413Z',
        createdBy,
        updatedAt: '2022-09-14T14:13:05.326Z',
        updatedBy: createdBy,
        title: 'How to web3 in Uni? ',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph'
            },
            {
              type: 'paragraph',
              content: [
                {
                  text: 'This piece is brought to you by your frens over at Charmverse',
                  type: 'text',
                  marks: [
                    {
                      type: 'italic'
                    }
                  ]
                }
              ]
            }
          ]
        },
        contentText: 'This piece is brought to you by your frens over at Charmverse ',
        headerImage: null,
        icon: '📚',
        path: `page-${v4()}`,
        isTemplate: false,
        parentId: boardId,
        spaceId,
        type: 'card',
        boardId: null,
        autoGenerated: false,
        index: -1,
        snapshotProposalId: null,
        fullWidth: false,
        bountyId: null,
        children: [],
        blocks: {
          card: {
            id: cardIds[1],
            deletedAt: null,
            createdAt: '2022-08-25T17:19:05.413Z',
            createdBy,
            updatedAt: '2022-08-25T17:21:39.462Z',
            updatedBy: createdBy,
            spaceId,
            parentId: boardId,
            rootId: boardId,
            schema: 1,
            type: 'card',
            title: 'Card 1',
            fields: {
              icon: '',
              isTemplate: false,
              properties: {
                '01221ad0-94d5-4d88-9ceb-c517573ad765': '{"from":1661515200000}'
              },
              headerImage: null,
              contentOrder: []
            }
          }
        }
      }
    ],
    blocks: {
      board: {
        id: boardId,
        deletedAt: null,
        createdAt: '2022-08-25T17:19:05.413Z',
        createdBy,
        updatedAt: '2022-08-25T17:26:01.401Z',
        updatedBy: createdBy,
        spaceId,
        parentId: '',
        rootId: boardId,
        schema: 1,
        type: 'board',
        title: 'My blog',
        fields: {
          icon: '📝',
          isTemplate: false,
          description: '',
          headerImage: null,
          cardProperties: [
            {
              id: '4452f79d-cfbf-4d18-aa80-b5c0bc002c5f',
              name: 'Status',
              type: 'select',
              options: [
                {
                  id: 'c5689c24-eb32-4af9-8e8d-e4191fbeb0a1',
                  color: 'propColorTeal',
                  value: 'Completed'
                },
                {
                  id: '12e5760e-470b-4466-83ad-dacc0acc2b3e',
                  color: 'propColorYellow',
                  value: 'In progress'
                },
                {
                  id: 'd21b567d-fd35-496e-8f7c-1ee62e95d4f2',
                  color: 'propColorRed',
                  value: 'Not started'
                }
              ]
            },
            {
              id: '01221ad0-94d5-4d88-9ceb-c517573ad765',
              name: 'Published on',
              type: 'date',
              options: []
            }
          ],
          showDescription: false,
          columnCalculations: []
        }
      },
      views: [] as Block[]
    }
  };

  rootBoardNode.children = rootBoardNode.children.splice(0, cardCount);

  const pageCreateArgs: Prisma.PageCreateArgs[] = [];
  const blockCreateInput: Prisma.BlockCreateManyInput[] = [];

  const cardPages = rootBoardNode.children;

  for (let i = 2; i < cardCount; i++) {
    if (i % 2 === 0) {
      cardPages.push({ ...cardPages[0], id: cardIds[i] });
    } else {
      cardPages.push({ ...cardPages[1], id: cardIds[i] });
    }
  }

  rootBoardNode.blocks.views = rootBoardNode.blocks.views.splice(0, views);

  for (let i = 0; i < views; i++) {
    rootBoardNode.blocks.views.push({
      id: v4(),
      deletedAt: null,
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
      updatedBy: createdBy,
      spaceId,
      parentId: boardId,
      rootId: boardId,
      schema: 1,
      type: 'view',
      title: `My entries - ${i + 1}`,
      fields: {
        filter: {
          filters: [],
          operation: 'and'
        },
        viewType: 'gallery',
        viewDataSource,
        cardOrder: [cardIds[1], cardIds[0]],
        sortOptions: [],
        columnWidths: {},
        hiddenOptionIds: [],
        visibleOptionIds: [],
        defaultTemplateId: '',
        collapsedOptionIds: [],
        columnCalculations: {},
        kanbanCalculations: {},
        visiblePropertyIds: ['__title', '01221ad0-94d5-4d88-9ceb-c517573ad765']
      }
    });
  }

  const pageContent: Pick<Prisma.PageCreateInput, 'content' | 'contentText'> = addPageContent
    ? pageContentStub()
    : {
        contentText: '',
        content: {
          type: 'doc',
          content: []
        }
      };

  [rootBoardNode, ...rootBoardNode.children].forEach((page) => {
    // Handle the root board node ------------------
    const {
      bountyId: droppedBountyId,
      cardId: droppedCardId,
      proposalId: droppedProposalId,
      blocks: droppedBlocks,
      spaceId: droppedSpaceId,
      createdBy: droppedCreatedBy,
      children,
      content,
      bounty,
      proposal,
      votes,
      ...pageWithoutExtraProps
    } = page as any as Page & PageWithBlocks & { children: any };

    // Prisma throws if passing null creation values
    typedKeys(pageWithoutExtraProps).forEach((key) => {
      if (pageWithoutExtraProps[key] === null) {
        delete pageWithoutExtraProps[key];
      }
    });

    const pageCreateInput: Prisma.PageCreateInput = {
      ...pageWithoutExtraProps,
      id: page.id,
      ...pageContent,
      type: page.type as PageType,
      author: {
        connect: {
          id: createdBy
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      }
    };

    pageCreateArgs.push({
      data: pageCreateInput
    });

    const blocks: Block[] = [];

    if (page.type === 'board') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const boardBlock = (page as any as PageWithBlocks).blocks.board!;
      const viewBlocks = (page as any as PageWithBlocks).blocks.views!;

      blocks.push(boardBlock, ...viewBlocks);
    } else if (page.type === 'card') {
      const cardBlock = (page as any as PageWithBlocks).blocks.card!;
      cardBlock.id = pageCreateInput.id as string;
      blocks.push(cardBlock);
    }

    blocks.forEach((block) => {
      typedKeys(block).forEach((key) => {
        if (block[key] === null) {
          delete block[key];
        }
      });

      blockCreateInput.push({
        ...block,
        fields: block.fields as Prisma.InputJsonValue
      });
    });
  });

  return {
    pageArgs: pageCreateArgs,
    blockArgs: {
      data: blockCreateInput
    }
  };
}
