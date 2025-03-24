'use client';

import { log } from '@charmverse/core/log';
import { useEffect, useRef, useState, useCallback } from 'react';

type LoadDataAction<T, U> = (opts: { cursor?: T }) => { serverError?: any; data: { data: U[]; nextCursor?: T } };

// Custom hook for infinite scrolling. returns a ref to the target element which should sit below the list
export function useInfiniteScroll<T, U>(
  loadData: LoadDataAction<T, U>,
  initialData: U[] = [],
  initialCursor: T | undefined = undefined
) {
  const targetRef = useRef(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<LoadDataAction<T, U>>['data']>({
    data: initialData,
    nextCursor: initialCursor
  });
  const [isLoading, setIsLoading] = useState(false);

  const callLoadData = useCallback(async () => {
    if (isLoading || error || (!result.nextCursor && result.data.length)) return;

    setIsLoading(true);
    try {
      // console.log('loading data', result.nextCursor);
      const actionResponse = await loadData({ cursor: result.nextCursor });
      if (actionResponse?.data) {
        const { data: newData = [], nextCursor } = actionResponse.data;
        setResult((prev) => ({
          data: [...prev.data, ...newData],
          nextCursor
        }));
      } else if (actionResponse?.serverError) {
        setError(actionResponse.serverError.message);
        log.warn('Error fetching more developers', {
          error: actionResponse.serverError,
          cursor: result.nextCursor
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, error, result.nextCursor, result.data.length, loadData]);

  useEffect(() => {
    // trigger loadData when target element is in view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callLoadData();
        }
      },
      { threshold: 0.1 }
    );

    // attach observer to target element
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callLoadData, targetRef]);

  // reset the data when the initial data is changed due to change of inputs into the loadMore method (e.g. nftType)
  useEffect(() => {
    setResult({
      data: initialData,
      nextCursor: initialCursor
    });
  }, [initialData, initialCursor]);

  return {
    observedTarget: targetRef,
    error,
    isLoading,
    data: result.data,
    hasMore: !!result.nextCursor
  };
}
