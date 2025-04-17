'use client';

import { isDraftSeason } from '@packages/dates/utils';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { useUser } from './UserProvider';

export type OnboardingStep = '1' | '2' | '3' | '4';

interface OnboardingRoutesContextType {
  getNextRoute: (overwriteStep?: OnboardingStep) => string;
}

const OnboardingRoutesContext = createContext<OnboardingRoutesContextType | undefined>(undefined);

interface OnboardingRoutesProviderProps {
  children: ReactNode;
}

export function OnboardingRoutesProvider({ children }: OnboardingRoutesProviderProps) {
  const pathname = usePathname();
  const { user } = useUser();

  /**
   * Define the next route based on current step
   *
   * This method keeps the search params in the url
   */
  const getNextRoute = useCallback(
    (overwriteStep?: OnboardingStep): string => {
      const baseRoute = '/welcome';
      const draftSeason = isDraftSeason();
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const step = overwriteStep || (urlParams.get('step') as OnboardingStep) || '1';
      const type = (urlParams.get('type') as 'scout' | 'builder' | undefined) || 'scout';
      const redirectUrlEncoded = urlParams.get('redirectUrl') as string | undefined;
      const redirectUrl = redirectUrlEncoded
        ? decodeURIComponent(redirectUrlEncoded)
        : draftSeason
          ? '/draft'
          : type === 'builder'
            ? '/developers'
            : '/scout';
      const profileRedirect = urlParams.get('profile-redirect') as 'true' | 'false' | undefined;

      if (pathname.includes('developer-registration-callback')) {
        urlParams.set('step', '3');
        urlParams.set('type', 'builder');
        return `${baseRoute}?${urlParams.toString()}`;
      }

      switch (step) {
        // Welcome with extra details
        case '1': {
          if (type === 'builder') {
            urlParams.set('step', '2');
            return `${baseRoute}?${urlParams.toString()}`;
          } else if (user?.builderStatus) {
            urlParams.set('step', '3');
            return `${baseRoute}?${urlParams.toString()}`;
          } else {
            urlParams.set('step', '4');
            return `${baseRoute}?${urlParams.toString()}`;
          }
        }
        // Builder page
        case '2': {
          return '/api/connect-github/get-link';
        }
        // Spam policy
        case '3': {
          if (profileRedirect === 'true') {
            return '/profile';
          } else {
            return redirectUrl;
          }
        }
        // How it works
        case '4':
          if (user?.farcasterId && type !== 'builder') {
            return `/builders-you-know`;
          } else {
            return redirectUrl;
          }

        default:
          return redirectUrl;
      }
    },
    [pathname, user?.builderStatus, user?.farcasterId]
  );

  const value = useMemo(
    () => ({
      getNextRoute
    }),
    [getNextRoute]
  );

  return <OnboardingRoutesContext.Provider value={value}>{children}</OnboardingRoutesContext.Provider>;
}

// Custom hook to use the OnboardingRoutes context
export function useOnboardingRoutes() {
  const context = useContext(OnboardingRoutesContext);

  if (context === undefined) {
    throw new Error('useOnboardingRoutes must be used within an OnboardingRoutesProvider');
  }
  return context;
}
