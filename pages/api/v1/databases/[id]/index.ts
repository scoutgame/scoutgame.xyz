
import { Block, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { validate } from 'uuid';
import { DatabasePage, PageProperty, PageQuery, PaginatedQuery, PaginatedResponse, Page, PageFromBlock, mapProperties, validatePageQuery, validatePaginationQuery } from 'lib/public-api';

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
 *     description: Use the ID of the Database Page, or its path ie. 'getting-started'. <br /> <br />  The board object contains the schema for the custom properties assigned to pages inside it.
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/DatabasePage'
 */
async function getDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;
  const space = await prisma.space.findUnique({ where: { id: spaceId } });

  if (!space) {
    return res.status(400).send({
      error: 'Space not found'
    });
  }

  const isValidUuid = validate(id as string);

  // eslint-disable-next-line prefer-const
  let [database, board] = await Promise.all([
    prisma.page.findFirst({
      where: isValidUuid ? {
        type: 'board',
        boardId: id as string,
        spaceId
      } : {
        type: 'board',
        path: id as string,
        spaceId
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

  const filteredDatabaseObject = filterObjectKeys(database as any as DatabasePage, 'include', ['id', 'createdAt', 'updatedAt', 'type', 'title', 'url']);

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
 *     summary: Search pages in database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The example properties below are only for illustrative purposes.<br/><br/>You can return up to 100 records per query
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
 *                  query:
 *                    type: object
 *                    $ref: '#/components/schemas/PageQuery'
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
 *                      $ref: '#/components/schemas/Page'
 */
async function searchDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      // This parameter is only added to ensure requests using the current API key only return data for that space
      spaceId
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }

  const searchQuery = req.body as PaginatedQuery<PageQuery>;

  try {
    validatePaginationQuery(searchQuery);
    validatePageQuery(searchQuery.query);
  }
  catch (error) {
    return res.status(400).send(error);
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const cardProperties = searchQuery.query?.properties ?? {};

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

  if (searchQuery.query?.title) {
    prismaQueryContent.title = {
      contains: searchQuery.query.title,
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

    return new PageFromBlock(card, boardSchema, (cardPageData?.fields as any)?.content);

  });

  let hasNext = false;
  let cursor: string | undefined;

  if (cards.length > 0) {

    const lastPageId = cards[cards.length - 1].id;

    const remainingRecords = await prisma.block.count({
      cursor: {
        id: lastPageId
      },
      skip: 1,
      where: prismaQueryContent,
      orderBy: {
        id: 'asc'
      }
    });

    if (remainingRecords > 0) {
      hasNext = true;
      cursor = lastPageId;
    }
  }

  const paginatedResponse: PaginatedResponse<Page> = {
    hasNext,
    cursor,
    data: cardsWithContent
  };

  return res.status(200).send(paginatedResponse);

}
export default handler;
