import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { countBlocks } from 'lib/prosemirror/countBlocks';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

export type DetailedDatabaseBlocksCount = {
  total: number;
  databaseViews: number;
  databaseDescriptions: number;
  databaseProperties: number;
  databaseRowPropValues: number;
  databaseTopLevelComments: number;
};

export async function countSpaceDatabaseBlockContentAndProps({
  spaceId
}: {
  spaceId: string;
}): Promise<DetailedDatabaseBlocksCount> {
  const detailedCount: DetailedDatabaseBlocksCount = {
    total: 0,
    databaseViews: 0,
    databaseDescriptions: 0,
    databaseProperties: 0,
    databaseRowPropValues: 0,
    databaseTopLevelComments: 0
  };

  // 1 - Count views & comments
  detailedCount.databaseTopLevelComments = await prisma.block.count({
    where: { spaceId, type: 'comment' }
  });
  detailedCount.databaseViews = await prisma.block.count({
    where: { spaceId, type: 'view' }
  });

  const databaseBlockRecords = await prisma.block.findMany({
    where: {
      type: 'board',
      spaceId
    },
    select: {
      id: true,
      fields: true
    }
  });

  // 2 - Count database block descriptions
  const databaseBlockDescriptionCounts = databaseBlockRecords
    .map((board) => countBlocks((board.fields as any)?.description, { blockId: board.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  detailedCount.databaseDescriptions = databaseBlockDescriptionCounts;

  // 3 - Get schemas for each database block and sum up
  let totalProperties = 0;

  const databaseSchemas = databaseBlockRecords.reduce((acc, block) => {
    // Create a local map for this database
    const boardProps = (block as any as Board).fields.cardProperties?.reduce((propAcc, prop) => {
      totalProperties += 1;
      propAcc[prop.id] = prop;
      return propAcc;
    }, {} as Record<string, IPropertyTemplate>);
    acc[block.id] = boardProps;
    return acc;
  }, {} as Record<string, Record<string, IPropertyTemplate>>);

  detailedCount.databaseProperties = totalProperties;

  const cardPropValues = await paginatedPrismaTask({
    batchSize: 2,
    model: 'block',
    queryOptions: {
      where: {
        spaceId,
        type: 'card'
      },
      select: {
        id: true,
        rootId: true,
        fields: true
      }
    },
    reducer: _sum,
    callback: (cards: Pick<Card, 'fields' | 'rootId'>[]) => {
      return cards.reduce((acc, card) => {
        const cardProps = Object.entries(card.fields.properties ?? {});
        const cardPropCounts: number = cardProps.reduce((cardPropAcc, [propId, propValue]) => {
          const matchingSchema = databaseSchemas[card.rootId]?.[propId];
          if (
            // Edge case for number type fields
            (!propValue && propValue !== 0) ||
            (Array.isArray(propValue) && !propValue.length) ||
            !matchingSchema
          ) {
            return cardPropAcc;
          }
          return cardPropAcc + 1;
        }, 0);

        return acc + cardPropCounts;
      }, 0);
    }
  });

  detailedCount.databaseRowPropValues = cardPropValues;

  // Summing up all counts

  detailedCount.total = _sum(Object.values(detailedCount));

  return detailedCount;
}
