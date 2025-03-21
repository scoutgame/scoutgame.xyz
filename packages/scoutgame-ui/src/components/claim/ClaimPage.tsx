import { Stack } from '@mui/material';
import { Suspense } from 'react';

import { LoadingComponent } from '../common/Loading/LoadingComponent';
import { LoadingTable } from '../common/Loading/LoadingTable';

import { BuilderRewardsScreen } from './components/BuilderRewardsScreen/BuilderRewardsScreen';
import { PointsClaimContainer } from './components/PointsClaimContainer';
import { ClaimedPointsTable } from './components/PointsTable/ClaimedPointsTable';

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
          <PointsClaimContainer />
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
          <ClaimedPointsTable />
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
