'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import type {
  DeveloperMetadata,
  DevelopersSortBy,
  DeveloperTableCursor
} from '@packages/scoutgame/builders/getDevelopersForTable';
import { getDevelopersForTableAction } from '@packages/scoutgame/builders/getDevelopersForTableAction';
import { useInfiniteScroll } from '@packages/scoutgame-ui/hooks/useInfiniteScroll';
import { useCallback } from 'react';

import { AllDevelopersTable } from './AllDevelopersTable';

export function AllDevelopersTableContainer({
  initialDevelopers = [],
  initialCursor = null,
  sortBy = 'week_gems',
  order = 'asc',
  nftType = 'starter'
}: {
  initialDevelopers?: DeveloperMetadata[];
  initialCursor?: DeveloperTableCursor | null;
  sortBy?: DevelopersSortBy;
  order?: 'asc' | 'desc';
  nftType: 'default' | 'starter';
}) {
  const fetchDevelopers = useCallback(
    (opts: { cursor: DeveloperTableCursor | null }) => {
      return getDevelopersForTableAction({
        sortBy,
        order,
        nftType,
        cursor: opts.cursor || null
      });
    },
    [sortBy, order, nftType]
  );

  const {
    observedTarget,
    data: developers,
    isLoading,
    hasMore,
    error
  } = useInfiniteScroll<DeveloperTableCursor | null, DeveloperMetadata>(
    fetchDevelopers as any,
    initialDevelopers,
    initialCursor
  );

  return (
    <div>
      <AllDevelopersTable developers={developers} order={order} sort={sortBy} />
      {hasMore && <div ref={observedTarget} style={{ height: '50px', width: '100%' }} />}
      {isLoading && (
        <Box display='flex' justifyContent='center' my={2}>
          <CircularProgress size={30} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
    </div>
  );
}
