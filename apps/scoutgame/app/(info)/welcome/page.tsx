import { log } from '@charmverse/core/log';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { BuilderPage } from '@packages/scoutgame-ui/components/welcome/builder/BuilderWelcomePage';
import { HowItWorksPage } from '@packages/scoutgame-ui/components/welcome/how-it-works/HowItWorksPage';
import { SpamPolicyPage } from '@packages/scoutgame-ui/components/welcome/spam-policy/SpamPolicyPage';
import { TaikoCreateProjectScreen } from '@packages/scoutgame-ui/components/welcome/taiko-builder/components/TaikoCreateProjectScreen';
import { TaikoBuilderWelcomePage } from '@packages/scoutgame-ui/components/welcome/taiko-builder/TaikoBuilderWelcomePage';
import { WelcomePage } from '@packages/scoutgame-ui/components/welcome/WelcomePage';
import type { OnboardingStep } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

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
      if (user.onboardedAt && user.agreedToTermsAt) {
        log.debug('Redirect user to home page from Welcome page', { startingPagePath, userId: user.id });
        redirect(startingPagePath);
      }
      return <WelcomePage user={user} />;
    }
    case '2': {
      if (
        (user.onboardedAt && user.agreedToTermsAt && user.builderStatus !== 'rejected') ||
        user.builderStatus === null
      ) {
        return user.utmCampaign === 'taiko' ? <TaikoBuilderWelcomePage /> : <BuilderPage />;
      }
      log.debug('Redirect user to home page from Builder page', { userId: user.id });
      return redirect(startingPagePath);
    }
    case '3': {
      if (user.utmCampaign === 'taiko') {
        return <TaikoCreateProjectScreen />;
      }
      if (user.builderStatus) {
        return <SpamPolicyPage />;
      }
      log.debug('Redirect user to home page from Spam Policy page', { userId: user.id });
      return redirect(startingPagePath);
    }
    case '4': {
      return <HowItWorksPage />;
    }
    default:
      return null;
  }
}
