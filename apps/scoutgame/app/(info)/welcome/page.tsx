import { log } from '@charmverse/core/log';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { loadBuildersUserKnows } from '@packages/scoutgame/social/loadBuildersUserKnows';
import { BuilderPage } from '@packages/scoutgame-ui/components/welcome/builder/BuilderWelcomePage';
import { HowItWorksPage } from '@packages/scoutgame-ui/components/welcome/how-it-works/HowItWorksPage';
import { SpamPolicyPage } from '@packages/scoutgame-ui/components/welcome/spam-policy/SpamPolicyPage';
import { WelcomePage } from '@packages/scoutgame-ui/components/welcome/WelcomePage';
import type { OnboardingStep } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BuildersYouKnowPage } from '../../../components/builders-you-know/BuildersYouKnowPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function Welcome({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams.step as OnboardingStep | undefined) || '1';
  const type = (searchParams.type as 'scout' | 'builder' | undefined) || 'scout';
  const redirectUrl = searchParams.redirectUrl as string | undefined;

  const startingPagePath = redirectUrl || '/scout';
  // logic in  middleware.ts guarantees that user exists
  const user = await getUserFromSession();

  // Fallback, but this case is handled in the middleware
  if (!user) {
    return null;
  }

  switch (scoutSort) {
    case '1': {
      if (user?.onboardedAt && user?.agreedToTermsAt) {
        log.debug('Redirect user to home page from Welcome page', { userId: user.id });
        redirect(startingPagePath);
      }
      return <WelcomePage user={user} />;
    }
    case '2':
      if (type === 'builder') {
        return <BuilderPage />;
      }
      return null;
    case '3': {
      if (user.builderStatus) {
        return <SpamPolicyPage />;
      }
      return null;
    }
    case '4': {
      return <HowItWorksPage />;
    }
    case '5': {
      const data = await loadBuildersUserKnows({ fid: user.farcasterId });
      if (!data || (data.buildersFollowingUser.length === 0 && data.buildersUserFollows.length === 0)) {
        redirect(startingPagePath);
      }
      return <BuildersYouKnowPage builders={data.buildersFollowingUser.concat(data.buildersUserFollows)} />;
    }
    default:
      return null;
  }
}
