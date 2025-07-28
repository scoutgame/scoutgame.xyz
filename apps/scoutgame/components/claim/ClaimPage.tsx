import { Stack } from '@mui/material';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { Suspense } from 'react';

import { AirdropClaimLink } from './components/AirdropClaimLink';
import { DeveloperRewardsScreen } from './components/DeveloperRewardsScreen/DeveloperRewardsScreen';
import { TokensClaimContainer } from './components/TokensClaimContainer';
import { ClaimedTokensTable } from './components/TokensTable/ClaimedTokensTable';

export type ClaimPageProps = {
  period: string;
  season: string;
  claimedSeason?: string;
};

export function ClaimPage({ period, season, claimedSeason }: ClaimPageProps) {
  return (
    <Stack
      gap={8}
      mt={2}
      flexDirection={{
        xs: 'column',
        md: 'row'
      }}
    >
      <Stack flex={1} gap={4}>
        <Suspense fallback={<LoadingComponent />}>
          <AirdropClaimLink />
        </Suspense>
        <Suspense fallback={<LoadingComponent />}>
          <TokensClaimContainer />
        </Suspense>
        <Stack
          sx={{
            display: {
              xs: 'flex',
              md: 'none'
            }
          }}
        >
          <DeveloperRewardsScreen period={period} season={season} claimedSeason={claimedSeason} />
        </Stack>
        <Suspense fallback={<LoadingTable />}>
          <ClaimedTokensTable claimedSeason={claimedSeason} />
        </Suspense>
      </Stack>
      <Stack
        sx={{
          flex: 1,
          height: 'fit-content',
          justifyContent: 'flex-start',
          display: {
            xs: 'none',
            md: 'flex'
          }
        }}
      >
        <DeveloperRewardsScreen period={period} season={season} claimedSeason={claimedSeason} />
      </Stack>
    </Stack>
  );
}
