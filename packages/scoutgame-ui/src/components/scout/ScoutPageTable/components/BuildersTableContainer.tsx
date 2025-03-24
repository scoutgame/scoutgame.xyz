'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getDevelopersForTable';
import type { CompositeCursor } from '@packages/scoutgame/builders/getPaginatedBuilders';
import { getPaginatedBuildersAction } from '@packages/scoutgame/builders/getPaginatedBuildersAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';

import { BuildersTable } from './BuildersTable';

export function BuildersTableContainer({
  initialBuilders,
  initialCursor,
  order,
  sort,
  nftType = 'default'
}: {
  initialBuilders: BuilderInfo[];
  initialCursor: CompositeCursor | null;
  order: 'asc' | 'desc';
  sort: BuildersSortBy;
  nftType?: 'default' | 'starter_pack';
}) {
  const {
    observedTarget,
    data: builders,
    isLoading,
    hasMore,
    error
  } = useInfiniteScroll<CompositeCursor | null, BuilderInfo>(
    (opts) =>
      getPaginatedBuildersAction({
        cursor: opts.cursor || undefined,
        nftType
      }) as any,
    initialBuilders,
    initialCursor
  );

  // Convert BuilderInfo to BuilderMetadata for the table component
  const buildersData = builders.map((builder) => ({
    path: builder.path,
    avatar: builder.avatar as string,
    displayName: builder.displayName,
    price: builder.price,
    level: builder.level,
    gemsCollected: builder.gemsCollected || 0,
    estimatedPayout: builder.estimatedPayout,
    last14Days: builder.last14DaysRank || [],
    nftsSoldToLoggedInScout: null, // Default null
    rank: 0 // Default rank value
  }));

  return (
    <>
      <BuildersTable builders={buildersData} order={order} sort={sort} />
      {hasMore && <div ref={observedTarget} style={{ height: '50px', width: '100%' }} />}
      {isLoading && (
        <Box display='flex' justifyContent='center' my={2}>
          <CircularProgress size={30} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
    </>
  );
}
