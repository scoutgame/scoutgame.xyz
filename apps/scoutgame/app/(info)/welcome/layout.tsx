import type { PageMap } from '@packages/scoutgame-ui/components/layout/SearchParamsTracking';
import { SearchParamsTracking } from '@packages/scoutgame-ui/components/layout/SearchParamsTracking';
import type { OnboardingStep } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import { OnboardingRoutesProvider } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import type { ReactNode } from 'react';

const welcomeMap: PageMap<OnboardingStep> = {
  '1': { path: '/welcome', title: 'Welcome' },
  '2': { path: '/builder', title: 'Builder' },
  '3': { path: '/spam-policy', title: 'Spam Policy' },
  '4': { path: '/how-it-works', title: 'How it works' },
  '5': { path: '/builders-you-know', title: 'Builders you know' }
};

export default function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <OnboardingRoutesProvider>
      <SearchParamsTracking pageMap={welcomeMap} paramName='step' defaultValue='1' />
      {children}
    </OnboardingRoutesProvider>
  );
}
