import { BuilderSetupPage } from '@packages/scoutgame-ui/components/builder-registration-callback/BuilderSetupPage';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Builder Setup'
};

export default async function BuilderSetup({
  searchParams: { state, code, error, 'profile-redirect': redirectToProfile }
}: {
  searchParams: { state: string; code: string; error: string; 'profile-redirect': string };
}) {
  return (
    <BuilderSetupPage state={state} code={code} githubRedirectError={error} redirectToProfile={redirectToProfile} />
  );
}
