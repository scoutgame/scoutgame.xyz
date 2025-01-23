import { OnboardingRoutesProvider } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import type { ReactNode } from 'react';

export default function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <OnboardingRoutesProvider>{children}</OnboardingRoutesProvider>;
}
