import { getCurrentSeasonStart } from '@packages/dates/utils';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import type { Metadata } from 'next';

import { ClaimPage } from 'components/claim/ClaimPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Claim Points'
};

export default async function Claim({
  searchParams
}: {
  searchParams: Promise<{ claimedSeason?: string; tab: string; season?: string }>;
}) {
  const searchParamsResolved = await searchParams;
  // if period is not 'season', ensure that season is the current season
  if (searchParamsResolved.tab !== 'season' || !searchParamsResolved.season) {
    searchParamsResolved.season = getCurrentSeasonStart();
  }
  return (
    <PageContainer>
      <ClaimPage
        period={searchParamsResolved.tab}
        season={searchParamsResolved.season}
        claimedSeason={searchParamsResolved.claimedSeason}
      />
    </PageContainer>
  );
}
