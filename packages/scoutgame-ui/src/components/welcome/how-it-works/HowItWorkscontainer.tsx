'use client';

import { useRouter } from 'next/navigation';
import { useOnboardingRoutes } from 'providers/OnboardingRoutes';
import type { MouseEventHandler } from 'react';

import { HowItWorksContent } from './HowItWorksContent';

export function HowItWorksContainer() {
  const router = useRouter();
  const { getNextRoute } = useOnboardingRoutes();

  const handleContinue = () => {
    router.push(getNextRoute());
  };

  return <HowItWorksContent onClickContinue={handleContinue} />;
}
