import { getCurrentSeasonStart } from '@packages/dates/utils';
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

export default async function Claim({ searchParams }: { searchParams: { tab: string; season?: string } }) {
  // if period is not 'season', ensure that season is the current season
  if (searchParams.tab !== 'season' || !searchParams.season) {
    searchParams.season = getCurrentSeasonStart();
  }
  return (
    <PageContainer>
      <ClaimPage period={searchParams.tab} season={searchParams.season} />
    </PageContainer>
  );
}
