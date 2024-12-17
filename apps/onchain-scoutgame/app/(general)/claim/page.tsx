import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { ClaimPage } from '@packages/scoutgame-ui/components/claim/ClaimPage';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Claim Points'
};

export default async function Claim({ searchParams }: { searchParams: { tab: string } }) {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  return (
    <PageContainer>
      <ClaimPage period={searchParams.tab} />
    </PageContainer>
  );
}
