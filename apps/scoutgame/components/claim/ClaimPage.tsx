import { Stack } from '@mui/material';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { Suspense } from 'react';

import { BuilderRewardsScreen } from './components/BuilderRewardsScreen/BuilderRewardsScreen';
import { TokensClaimContainer } from './components/TokensClaimContainer';
import { ClaimedTokensTable } from './components/TokensTable/ClaimedTokensTable';

export type ClaimPageProps = {
  period: string;
  season: string;
};

export function ClaimPage({ period, season }: ClaimPageProps) {
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
          <BuilderRewardsScreen period={period} season={season} />
        </Stack>
        <Suspense fallback={<LoadingTable />}>
          <ClaimedTokensTable />
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
        <BuilderRewardsScreen period={period} season={season} />
      </Stack>
    </Stack>
  );
}
