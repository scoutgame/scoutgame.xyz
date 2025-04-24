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
  searchParams
}: {
  searchParams: Promise<{ state: string; code: string; error: string; 'profile-redirect': string }>;
}) {
  const searchParamsResolved = await searchParams;
  return (
    <DeveloperSetupPage
      state={searchParamsResolved.state}
      code={searchParamsResolved.code}
      githubRedirectError={searchParamsResolved.error}
    />
  );
}
