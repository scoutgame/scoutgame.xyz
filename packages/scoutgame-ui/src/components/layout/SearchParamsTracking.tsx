'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { useTrackEvent } from '../../hooks/useTrackEvent';

export type PageMap<T extends string | number> = Record<T, { path: string; title: string }>;

export interface SearchParamsTrackingProps<T extends string | number> {
  pageMap: PageMap<T>;
  paramName: string;
  defaultValue?: T;
}

/**
 * This component is used to track URL query params as page views
 *
 * Use `pageMap` to get the page title and path based on the query param value
 *
 * Use `paramName` to get the value of the parameter from the url
 *
 * Use `defaultValue` to set the value of the parameter if it is not provided in the url
 */
export function SearchParamsTracking<T extends string | number>({
  pageMap,
  paramName,
  defaultValue
}: SearchParamsTrackingProps<T>) {
  return (
    <Suspense>
      <SearchParamsTrackingLogic pageMap={pageMap} paramName={paramName} defaultValue={defaultValue} />
    </Suspense>
  );
}

export async function SearchParamsTrackingLogic<T extends string | number>({
  pageMap,
  paramName,
  defaultValue
}: SearchParamsTrackingProps<T>) {
  const trackEvent = useTrackEvent();
  const searchParams = useSearchParams();
  const searchParamsResolved = await searchParams;
  const paramValue = searchParamsResolved.get(paramName) as T | null;
  const searchParamsString = searchParamsResolved.toString();

  useEffect(() => {
    const valueToUse = paramValue ?? defaultValue;
    const page = valueToUse ? pageMap[valueToUse] : null;

    if (page) {
      trackEvent('page_view', {
        currentPageTitle: page.title,
        currentUrlPath: page.path
      });
    }
  }, [searchParamsString, paramValue, defaultValue, trackEvent, pageMap]);

  return null;
}
