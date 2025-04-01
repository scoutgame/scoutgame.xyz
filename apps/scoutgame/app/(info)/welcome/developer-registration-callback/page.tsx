import type { Metadata } from 'next';

import { DeveloperSetupPage } from 'components/developer-registration-callback/DeveloperSetupPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Developer Setup'
};

export default async function BuilderSetup({
  searchParams: { state, code, error, 'profile-redirect': redirectToProfile }
}: {
  searchParams: { state: string; code: string; error: string; 'profile-redirect': string };
}) {
  return <DeveloperSetupPage state={state} code={code} githubRedirectError={error} />;
}
