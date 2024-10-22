import { Box, Stack } from '@mui/material';
import { Suspense } from 'react';

import { PointsClaimScreen } from 'components/claim/components/PointsClaimScreen/PointsClaimScreen';
import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
import type { WeeklyReward } from 'lib/points/getPointsWithEvents';

import { PageContainer } from '../layout/PageContainer';

import { BuilderRewardsTable } from './components/BuilderRewardsTable/BuilderRewardsTable';
import { ClaimedPointsTable } from './components/PointsTable/ClaimedPointsTable';
import { PointsTable } from './components/PointsTable/PointsTable';

export type ClaimPageProps = {
  totalClaimablePoints: number;
  weeklyRewards: WeeklyReward[];
  bonusPartners: string[];
  username: string;
};

export function ClaimPage({ username, totalClaimablePoints, weeklyRewards, bonusPartners }: ClaimPageProps) {
  return (
    <PageContainer>
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
        data-test='claim-page'
      >
        <Stack
          gap={2}
          mt={2}
          flexDirection={{
            xs: 'column-reverse',
            md: 'row'
          }}
        >
          <Stack flex={1} gap={4}>
            <PointsClaimScreen
              totalClaimablePoints={totalClaimablePoints}
              username={username}
              bonusPartners={bonusPartners}
            />
            <PointsTable
              weeklyRewards={weeklyRewards}
              title='Unclaimed'
              emptyMessage='Nice, you have claimed all of your rewards to date!'
            />
            <Suspense fallback={<LoadingComponent isLoading />}>
              <ClaimedPointsTable />
            </Suspense>
          </Stack>
          <Stack flex={1}>
            <BuilderRewardsTable />
          </Stack>
        </Stack>
      </Box>
    </PageContainer>
  );
}