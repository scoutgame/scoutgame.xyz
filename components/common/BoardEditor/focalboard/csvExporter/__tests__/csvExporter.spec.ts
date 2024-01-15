import type { Block, ProposalEvaluation } from '@charmverse/core/prisma';
import { v4 as uuid, v4 } from 'uuid';

import type { Formatters, PropertyContext } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { addProposalEvaluationProperties } from 'lib/focalboard/addProposalEvaluationProperties';
import { prismaToBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import type { CardPropertyValue } from 'lib/focalboard/card';
import { createCard } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { extractDatabaseProposalProperties } from 'lib/focalboard/extractDatabaseProposalProperties';
import { generateResyncedProposalEvaluationForCard } from 'lib/focalboard/generateResyncedProposalEvaluationForCard';
import { getBoardProperties } from 'lib/focalboard/setDatabaseProposalProperties';
import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { formatDate, formatDateTime } from 'lib/utilities/dates';
import { createMockBoard, createMockCard } from 'testing/mocks/block';

import { CsvExporter, getCSVColumns } from '../csvExporter';

import { generateFields, mockBoardBlock, mockCardBlock } from './mocks';

const formatters: Formatters = {
  date: formatDate,
  dateTime: formatDateTime
};

const emptyContext: PropertyContext = {
  spaceDomain: 'test-space',
  users: {}
};

describe('CsvExporter', () => {
  test('should generate rows to help export easyar the csv', async () => {
    const spaceId = uuid();
    const userId = uuid();

    const boardId = uuid();
    const boardBlock = {
      ...mockBoardBlock,
      id: boardId,
      createdBy: userId,
      spaceId,
      rootId: boardId
    };
    const blockBoardFromPrismaToBlock = prismaToBlock(boardBlock);
    const board = createBoard({ block: blockBoardFromPrismaToBlock, addDefaultProperty: true });
    const cardPropertyOptions = board.fields.cardProperties[0].options;
    const optionId = board.fields.cardProperties[0].id;
    const firstPropertyId = cardPropertyOptions[0].id;
    const secondPropertyId = cardPropertyOptions[1].id;
    const thirdPropertyId = cardPropertyOptions[2].id;

    const englishTitle = 'My wonderful card #1';
    const chineseTitle = '日本';
    const japaneseTitle = 'こんにちは';

    const cardBlock1: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: englishTitle,
      fields: {
        properties: {
          [optionId]: firstPropertyId as unknown as string
        }
      }
    };

    const cardBlock2: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: chineseTitle,
      fields: {
        properties: {
          [optionId]: secondPropertyId as unknown as string
        }
      }
    };

    const cardBlock3: Block = {
      ...mockCardBlock,
      id: uuid(),
      createdBy: userId,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      schema: 1,
      spaceId,
      rootId: boardId,
      parentId: boardId,
      title: japaneseTitle,
      fields: {
        properties: {
          [optionId]: ''
        }
      }
    };

    const cards = [cardBlock1, cardBlock2, cardBlock3].map((c) => prismaToBlock(c)).map((c) => createCard(c));
    const simpleBoardView = createBoardView();
    const viewFields = generateFields(
      [optionId],
      [firstPropertyId, secondPropertyId, thirdPropertyId],
      cards.map((c) => c.id)
    );
    const view: BoardView = {
      ...simpleBoardView,
      fields: viewFields
    };

    const rows = CsvExporter.exportTableCsv(board, view, cards, formatters, emptyContext);

    const rowsDecoded = decodeURIComponent(rows);

    // Expect titles and only selected properties to be in the csv
    expect(rowsDecoded.includes(englishTitle)).toBeTruthy();
    expect(rowsDecoded.includes(japaneseTitle)).toBeTruthy();
    expect(rowsDecoded.includes(chineseTitle)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[0].value)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[1].value)).toBeTruthy();
    expect(rowsDecoded.includes(cardPropertyOptions[2].value)).toBeFalsy();
  });
});

describe('getCSVColumns()', () => {
  it('Handles number properties as string or number type', () => {
    const board = createMockBoard();
    board.fields.cardProperties = [
      {
        id: 'property_id_1',
        name: 'MockStatus',
        type: 'number',
        options: []
      },
      {
        id: 'property_id_2',
        name: 'MockStatus 2',
        type: 'number',
        options: []
      }
    ];
    const card = createMockCard(board);
    card.fields.properties.property_id_1 = '10';
    card.fields.properties.property_id_2 = 20;

    const rowColumns = getCSVColumns({
      card,
      context: emptyContext,
      formatters,
      visibleProperties: [
        {
          id: Constants.titleColumnId,
          type: 'text',
          name: 'Title',
          options: []
        },
        ...board.fields.cardProperties
      ]
    });
    expect(rowColumns).toEqual(['"title"', '10', '20']);
  });

  it('Can export a card sourced from proposals', () => {
    const board = createMockBoard();
    board.fields.cardProperties = [];
    const boardProperties = getBoardProperties({
      boardBlock: board
    });

    board.fields.cardProperties = boardProperties;
    const databaseProperties = extractDatabaseProposalProperties({
      boardBlock: board
    });
    let properties: Record<string, CardPropertyValue> = {
      [databaseProperties.proposalUrl!.id]: 'path-123',
      [databaseProperties.proposalStatus!.id]: 'in_progress',
      [databaseProperties.proposalEvaluatedBy!.id]: 'user_1',
      [databaseProperties.proposalEvaluationType!.id]: 'rubric',
      [databaseProperties.proposalStep!.id]: 'Rubric evaluation'
    };
    const card = createMockCard(board);

    const criteria = {
      id: uuid()
    };

    const rubricSteps: Pick<ProposalEvaluation, 'id' | 'title'>[] = [
      {
        id: v4(),
        title: 'Rubric evaluation'
      },
      {
        id: v4(),
        title: 'Rubric evaluation 2'
      }
    ];

    const rubricAnswers: AnswerData[] = [
      {
        comment: null,
        response: { score: 4 },
        rubricCriteriaId: criteria.id,
        userId: 'user_1',
        evaluationId: rubricSteps[0].id
      },
      {
        comment: null,
        response: { score: 1 },
        rubricCriteriaId: criteria.id,
        userId: 'user_2',
        evaluationId: rubricSteps[0].id
      },
      {
        comment: null,
        response: { score: 3 },
        rubricCriteriaId: criteria.id,
        userId: 'user_1',
        evaluationId: rubricSteps[1].id
      }
    ];

    rubricSteps.forEach((rubricStep, index) => {
      properties = generateResyncedProposalEvaluationForCard({
        currentStep: rubricStep,
        databaseProperties,
        properties,
        rubricAnswers,
        rubricCriterias: [criteria],
        stepIndex: index
      });
    });

    Object.assign(card.fields.properties, properties);

    const context: PropertyContext = {
      users: { user_1: { username: 'Mo' }, user_2: { username: 'John Doe' } },
      spaceDomain: 'test-space'
    };

    const visiblePropertiesExtended = [
      { id: Constants.titleColumnId, type: 'text', name: 'Title', options: [] } as IPropertyTemplate,
      ...board.fields.cardProperties
    ];

    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      visibleProperties: visiblePropertiesExtended,
      evaluationTitles: ['Rubric evaluation', 'Rubric evaluation 1', 'Rubric evaluation 2']
    });

    expect(rowColumns).toStrictEqual([
      '"title"',
      '"In Progress"',
      '"http://localhost/test-space/path-123"',
      '"Rubric"',
      '"Rubric evaluation"',
      'Mo|John Doe',
      '2.5',
      '5',
      '',
      '',
      '',
      'Mo',
      '3',
      '3'
    ]);
  });
});
