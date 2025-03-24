'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import type {
  DeveloperMetadata,
  DevelopersSortBy,
  DeveloperTableCursor
} from '@packages/scoutgame/builders/getDevelopersForTable';
import { getDevelopersForTableAction } from '@packages/scoutgame/builders/getDevelopersForTableAction';
import { useCallback } from 'react';

import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';

import { DevelopersTable } from './DevelopersTable';

export function DevelopersTableContainer({
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

  const developersData = developers.map((developer) => ({
    path: developer.path,
    avatar: developer.avatar,
    displayName: developer.displayName,
    price: developer.price,
    level: developer.level,
    gemsCollected: developer.gemsCollected,
    estimatedPayout: developer.estimatedPayout,
    last14Days: developer.last14Days,
    nftsSoldToLoggedInScout: developer.nftsSoldToLoggedInScout,
    rank: developer.rank
  }));

  return (
    <div>
      <DevelopersTable developers={developersData} order={order} sort={sortBy} />
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
