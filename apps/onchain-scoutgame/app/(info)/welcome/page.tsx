import { log } from '@charmverse/core/log';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { WelcomePage } from '@packages/scoutgame-ui/components/welcome/WelcomePage';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function Welcome() {
  const user = await getUserFromSession();

  if (user?.onboardedAt && user?.agreedToTermsAt && !user?.builderStatus) {
    log.debug('Redirect user to home page from Welcome page', { userId: user.id });
    redirect('/');
  }

  // logic in  middleware.ts guarantees that user exists
  return <WelcomePage user={user!} />;
}
