'use client';

import { log } from '@charmverse/core/log';
import { Alert, Box } from '@mui/material';
import type { CompositeCursor } from '@packages/scoutgame/builders/getPaginatedBuilders';
import { getPaginatedBuildersAction } from '@packages/scoutgame/builders/getPaginatedBuildersAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useState, useEffect, useRef, useCallback } from 'react';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { BuildersGallery } from '../../common/Gallery/BuildersGallery';
import { LoadingCards } from '../../common/Loading/LoadingCards';

export function BuildersGalleryContainer({
  initialBuilders,
  initialCursor
}: {
  initialCursor: CompositeCursor | null;
  initialBuilders: BuilderInfo[];
}) {
  const [error, setError] = useState<string | null>(null);
  const isDesktop = useMdScreen();
  const [builders, setBuilders] = useState(initialBuilders);
  const [nextCursor, setNextCursor] = useState<CompositeCursor | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const loadMoreBuilders = useCallback(async () => {
    if (isLoading || error || !nextCursor?.userId) return;

    setIsLoading(true);
    try {
      const actionResponse = await getPaginatedBuildersAction({ cursor: nextCursor });
      if (actionResponse?.data) {
        const { builders: newBuilders, nextCursor: newCursor } = actionResponse.data;
        setBuilders((prev) => [...prev, ...newBuilders]);
        setNextCursor(newCursor);
      } else if (actionResponse?.serverError) {
        setError(actionResponse.serverError.message);
        log.warn('Error fetching more developers', {
          error: actionResponse.serverError,
          cursor: nextCursor
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, nextCursor]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreBuilders();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const current = observerTarget.current;

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [loadMoreBuilders, observerTarget]);

  return (
    <>
      <BuildersGallery builders={builders} size={isDesktop ? 'large' : 'small'} columns={3} />
      {nextCursor && <div ref={observerTarget} style={{ height: '50px', width: '100%' }} />}
      {isLoading && (
        <Box my={2}>
          <LoadingCards count={3} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
    </>
  );
}
