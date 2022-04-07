
import { Block, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getSpaceFromApiKey, onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { CardFromBlock } from 'lib/public-api/card.class';
import { validate } from 'uuid';
import { BoardPage, CardProperty, CardQuery, PaginatedQuery, PaginatedResponse, Card } from 'lib/public-api/interfaces';
import { mapProperties } from 'lib/public-api/mapProperties';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getDatabase)
  .post(searchDatabase);

/**
 * @swagger
 * /databases/{databaseId}:
 *   get:
 *     summary: Find database by ID
 *     description: Use the ID of the board, or its path ie. 'getting-started'. <br /> <br />  The board object contains the schema for the custom properties assigned to cards.
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/BoardPage'
 */
async function getDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const isValidUuid = validate(id as string);

  // eslint-disable-next-line prefer-const
  let [database, board] = await Promise.all([
    prisma.page.findFirst({
      where: isValidUuid ? {
        type: 'board',
        boardId: id as string,
        spaceId: space.id
      } : {
        type: 'board',
        path: id as string,
        spaceId: space.id
      }

    }),
    isValidUuid ? prisma.block.findFirst({
      where: {
        type: 'board',
        id: id as string
      }
    }) : null
  ]);

  if (!isValidUuid && database && database.boardId) {
    board = await prisma.block.findFirst({
      where: {
        type: 'board',
        id: database.boardId as string
      }
    }) as any as Block;
  }

  if (!database || !board) {
    return res.status(404).send({ error: 'Database not found' });
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as BoardPage, 'include', ['id', 'createdAt', 'updatedAt', 'type', 'title', 'url']);

  const domain = process.env.DOMAIN;

  filteredDatabaseObject.url = `${domain}/${space.domain}/${database.path}`;

  (filteredDatabaseObject as any).schema = (board as any).fields.cardProperties;
  filteredDatabaseObject.id = board.id;

  return res.status(200).json(filteredDatabaseObject);
}

/**
 * @swagger
 * /databases/{databaseId}:
 *   post:
 *     summary: Search cards in database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The below example properties are only for illustrative purposes.<br/><br/>You can return up to 100 records per query
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  limit:
 *                    type: integer
 *                    required: false
 *                    example: 10
 *                  cursor:
 *                    type: string
 *                    required: false
 *                    example: e63758e2-de17-48b2-9c74-5a40ea5be761
 *                  card:
 *                    type: object
 *                    $ref: '#/components/schemas/CardQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  hasNext:
 *                    type: boolean
 *                    example: true
 *                  cursor:
 *                    type: string
 *                    example: bb6b7e20-680a-4202-8e2a-49570aba02fa
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Card'
 */
async function searchDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      // This parameter is only added to ensure requests using the current API key only return data for that space
      spaceId: space.id
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }

  const searchQuery = req.body as PaginatedQuery<{card: CardQuery}>;

  const boardSchema = (board.fields as any).cardProperties as CardProperty[];

  // Early exit to inform user these should be nested
  if ((searchQuery as any).title || (searchQuery as any).properties) {
    return res.status(400).json({
      error: 'The query properties such as \'title\' or \'properties\' for a card should be nested inside a \'card\' property in your request JSON',
      example: {
        card: {
          title: 'search title',
          properties: {
            Status: 'Completed'
          }
        }
      }
    });
  }

  const cardProperties = searchQuery.card?.properties ?? {};

  if (cardProperties && (typeof cardProperties !== 'object' || cardProperties instanceof Array)) {
    return res.status(400).send({
      error: 'Optional key cardProperties must be an object if provided'
    });
  }

  const nestedJsonQuery: Prisma.NestedJsonFilter [] = [];

  try {
    const queryProperties: Record<string, string | number> = mapProperties(cardProperties, boardSchema);

    Object.entries(queryProperties).forEach(queryItem => {
      nestedJsonQuery.push({
        path: ['properties', queryItem[0]],
        equals: queryItem[1]
      });
    });

  }
  catch (error) {
    return res.status(400).send(error);
  }

  const prismaQueryContent: Prisma.BlockWhereInput = {
    rootId: id as string,
    type: 'card',
    AND: nestedJsonQuery.map(nestedJson => {
      return {
        fields: nestedJson
      };
    })
  };

  if (searchQuery.card?.title) {
    prismaQueryContent.title = {
      contains: searchQuery.card.title,
      mode: 'insensitive'
    };
  }

  const prismaQueryWithCursor: Prisma.BlockFindManyArgs = {
    where: prismaQueryContent,
    orderBy: {
      id: 'asc'
    }
  };

  if (searchQuery.cursor) {
    prismaQueryWithCursor.cursor = { id: searchQuery.cursor };
    prismaQueryWithCursor.skip = 1;
  }

  const maxRecordsPerQuery = 100;

  if (searchQuery.limit) {
    prismaQueryWithCursor.take = Math.min(maxRecordsPerQuery, searchQuery.limit);
  }
  else {
    prismaQueryWithCursor.take = maxRecordsPerQuery;
  }

  const cards = (await prisma.block.findMany(prismaQueryWithCursor));

  const cardsPageContent = await prisma.block.findMany({
    where: {
      OR: cards.map(card => {
        return {
          parentId: card.id,
          type: 'charm_text'
        };
      })
    }
  });

  const cardsWithContent = cards.map(card => {
    const cardPageData = cardsPageContent.find(page => page.parentId === card.id);

    return new CardFromBlock(card, boardSchema, (cardPageData?.fields as any)?.content);

  });

  let hasNext = false;
  let cursor: string | undefined;

  if (cards.length > 0) {

    const lastCardId = cards[cards.length - 1].id;

    const remainingRecords = await prisma.block.count({
      cursor: {
        id: lastCardId
      },
      skip: 1,
      where: prismaQueryContent,
      orderBy: {
        id: 'asc'
      }
    });

    if (remainingRecords > 0) {
      hasNext = true;
      cursor = lastCardId;
    }
  }

  const paginatedResponse: PaginatedResponse<Card> = {
    hasNext,
    cursor,
    data: cardsWithContent
  };

  return res.status(200).send(paginatedResponse);

}
export default handler;
