'use client';

import { log } from '@charmverse/core/log';
import { Alert, Box } from '@mui/material';
import type { CompositeCursor } from '@packages/scoutgame/builders/getDevelopersForGallery';
import { getDevelopersForGalleryAction } from '@packages/scoutgame/builders/getDevelopersForGalleryAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useCallback } from 'react';

import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import { useMdScreen } from '../../../hooks/useMediaScreens';
import { BuildersGallery } from '../../common/Gallery/BuildersGallery';
import { LoadingCards } from '../../common/Loading/LoadingCards';

export function BuildersGalleryContainer({
  initialBuilders,
  initialCursor,
  nftType
}: {
  initialCursor: CompositeCursor | null;
  initialBuilders: BuilderInfo[];
  nftType: 'default' | 'starter';
}) {
  const isDesktop = useMdScreen();

  const fetchDevelopers = useCallback(
    (opts: { cursor: CompositeCursor | null }) => {
      return getDevelopersForGalleryAction({
        cursor: opts.cursor || null,
        nftType
      });
    },
    [nftType]
  );

  const {
    observedTarget,
    data: developers,
    isLoading,
    hasMore,
    error
  } = useInfiniteScroll<CompositeCursor | null, BuilderInfo>(fetchDevelopers as any, initialBuilders, initialCursor);

  return (
    <>
      <BuildersGallery builders={developers} size={isDesktop ? 'large' : 'small'} columns={3} />
      {hasMore && <div ref={observedTarget} style={{ height: '50px', width: '100%' }} />}
      {isLoading && (
        <Box my={2}>
          <LoadingCards count={3} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
    </>
  );
}
