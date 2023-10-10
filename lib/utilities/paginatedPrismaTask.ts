import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from './errors';

type PrismaModel = Extract<
  Uncapitalize<Prisma.ModelName>,
  'block' | 'page' | 'post' | 'proposal' | 'memberPropertyValue'
>;

type PrismaArgs<M extends PrismaModel> = Pick<
  M extends 'block'
    ? Prisma.BlockFindManyArgs
    : M extends 'page'
    ? Prisma.PageFindManyArgs
    : M extends 'post'
    ? Prisma.PostFindManyArgs
    : M extends 'proposal'
    ? Prisma.ProposalFindManyArgs
    : M extends 'memberPropertyValue'
    ? Prisma.MemberPropertyValueFindManyArgs
    : never,
  'select' | 'where' | 'include'
>;

/**
 * @param mapper - A synchronous or async function to run per each record returned
 * @param onSuccess - Optional rollup of the array of mapped results. If not provided, you will get the array of mapped records
 * @param batchSize - Number of records to fetch at a time
 */
type PaginatedTask<M extends PrismaModel, R, V> = {
  model: M;
  queryOptions: PrismaArgs<M>;
  batchSize?: number;
  mapper: (record: any) => R;
  // Reducer input based on return type of callback
  onSuccess?: (values: Awaited<R>[]) => V;
};

export const defaultPaginatedPrismaTaskBatchSize = 500;

/**
 * @param callback - Run this function on each set of results
 * @param reducer - Optional aggregation function to run on the results of the callback
 */
export async function paginatedPrismaTask<M extends PrismaModel, R>(
  args: Omit<PaginatedTask<M, R, any>, 'onSuccess'>
): Promise<Awaited<R>[]>;
export async function paginatedPrismaTask<M extends PrismaModel, R, V>(args: PaginatedTask<M, R, V>): Promise<V>;
export async function paginatedPrismaTask<M extends PrismaModel = PrismaModel, R = unknown, V = unknown>({
  batchSize = defaultPaginatedPrismaTaskBatchSize,
  mapper,
  model,
  queryOptions,
  onSuccess
}: PaginatedTask<M, R, V>): Promise<Awaited<R>[] | V> {
  // Assume processBatches is a functi
  if (queryOptions.select && queryOptions.include) {
    throw new InvalidInputError(`Cannot provide select AND include. Pick one or none`);
  } else if (queryOptions.select && !queryOptions.select.id) {
    throw new InvalidInputError(`Query options for ${model} must select at least id or include additional records`);
  }

  let cursor: string | undefined;

  const allProcessedResults: Awaited<R>[] = [];

  while (true) {
    // Typecast model to page to get a good example of how to use the PrismaClient, since generic is tricky
    const results = await prisma[model as 'page'].findMany({
      ...(queryOptions as Prisma.PageFindManyArgs),
      cursor: cursor ? { id: cursor } : undefined,
      take: batchSize,
      skip: cursor ? 1 : undefined,
      orderBy: {
        id: 'asc'
      }
    });

    if (results.length === 0) break;

    for (const result of results) {
      const mapped = await mapper(result);
      allProcessedResults.push(mapped);
    }

    cursor = results[results.length - 1].id;

    if (results.length < batchSize) break;
  }

  if (onSuccess) {
    return onSuccess(allProcessedResults);
  }
  return allProcessedResults as Awaited<R>[];
}
