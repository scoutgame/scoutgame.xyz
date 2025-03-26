'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import type { ScoutCursor, ScoutInfo, ScoutsSortBy } from '@packages/scoutgame/scouts/getPaginatedScouts';
import { getPaginatedScoutsAction } from '@packages/scoutgame/scouts/getPaginatedScoutsAction';

import { useInfiniteScroll } from '../../../../../hooks/useInfiniteScroll';

import { ScoutsTable } from './ScoutsTable';

export function ScoutsTableContainer({
  initialScouts,
  initialCursor,
  order,
  sort
}: {
  initialScouts: ScoutInfo[];
  initialCursor: ScoutCursor | null;
  order: 'asc' | 'desc';
  sort: ScoutsSortBy;
}) {
  const {
    observedTarget,
    data: scouts,
    isLoading,
    hasMore,
    error
  } = useInfiniteScroll<ScoutCursor | null, ScoutInfo>(
    (opts) =>
      getPaginatedScoutsAction({
        cursor: opts.cursor || null,
        sort,
        order
      }) as any,
    initialScouts,
    initialCursor
  );

  return (
    <>
      <ScoutsTable scouts={scouts} order={order} sort={sort} />
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
