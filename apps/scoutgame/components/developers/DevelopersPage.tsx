import 'server-only';

import { Grid, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { TabsMenu, type TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { Suspense } from 'react';

import { BuilderPageInviteCard } from './BuilderInviteCard/BuilderInviteCard';
import { BuilderPageTable } from './BuilderPageTable/BuilderPageTable';
import { DevelopersGlobal } from './Global/DevelopersGlobal';
import { PartnerRewardsCarousel } from './PartnerRewardsCarousel/PartnerRewardsCarousel';
import { ScoutsInfo } from './ScoutsInfo/ScoutsInfo';

export const mobileTabOptions: TabItem[] = [
  { label: 'Leaderboard', value: 'leaderboard' },
  { label: 'Recent Activity', value: 'activity' }
];

type Props = {
  week: string;
  tab: string;
  builderSort?: string;
  builderOrder?: string;
  user?: SessionUser | null;
};

export async function DevelopersPage({ week, tab, builderSort, builderOrder, user }: Props) {
  return (
    <>
      <Suspense>
        <DevelopersGlobal />
      </Suspense>
      <HeaderMessage />
      <Grid
        container
        spacing={1}
        sx={{
          flexGrow: 1,
          overflow: 'hidden'
        }}
        data-test='builders-page'
      >
        <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', overflowX: 'hidden', px: 1, gap: 2 }}>
          <PartnerRewards />
          <MainContent
            week={week}
            tab={tab}
            builderSort={builderSort as BuildersSortBy}
            builderOrder={builderOrder}
            user={user}
          />
        </Grid>
        <Grid size={4} sx={{ pr: 1, height: '100%', overflowX: 'hidden', display: { xs: 'none', md: 'block' } }}>
          <SidebarContent user={user} week={week} />
        </Grid>
      </Grid>
    </>
  );
}

export function MainContent({ week, tab, builderSort, builderOrder, user }: Props) {
  const isBuilder = !!user?.builderStatus;
  const hasPrimaryWallet = !!user?.primaryWallet;

  return isBuilder && hasPrimaryWallet ? (
    <BuildersMainContent week={week} tab={tab} builderSort={builderSort} builderOrder={builderOrder} user={user} />
  ) : (
    <ScoutsMainContent isBuilder={isBuilder} />
  );
}

export async function BuildersMainContent({ week, tab, builderSort, builderOrder, user }: Props) {
  return (
    <>
      {/* Builder desktop */}
      <Stack display={{ xs: 'none', md: 'block' }}>
        <Typography variant='h5' color='secondary' textAlign='center' my={1}>
          Leaderboard
        </Typography>
        <Suspense key='leaderboard' fallback={<LoadingTable />}>
          <BuilderPageTable
            tab='leaderboard'
            week={week}
            builderSort={builderSort as BuildersSortBy}
            builderOrder={builderOrder}
            userId={user?.id}
          />
        </Suspense>
      </Stack>
      {/* Builder mobile */}
      <Stack display={{ xs: 'block', md: 'none' }}>
        <TabsMenu value={tab} tabs={mobileTabOptions} queryKey='tab' />
        <Suspense key={tab} fallback={<LoadingTable />}>
          <BuilderPageTable
            tab={tab}
            week={week}
            builderSort={builderSort as BuildersSortBy}
            builderOrder={builderOrder}
            userId={user?.id}
          />
        </Suspense>
      </Stack>
    </>
  );
}

export async function ScoutsMainContent({ isBuilder }: { isBuilder: boolean }) {
  return (
    <>
      {/* Scout mobile */}
      <Stack display={{ xs: 'block', md: 'none' }}>
        <BuilderPageInviteCard isBuilder={isBuilder} />
      </Stack>
      {/* Scout desktop and mobile */}
      <ScoutsInfo />
    </>
  );
}

export async function SidebarContent({ user, week }: Pick<Props, 'user' | 'week'>) {
  const isBuilder = !!user?.builderStatus;
  const hasPrimaryWallet = !!user?.primaryWallet;

  return isBuilder && hasPrimaryWallet ? (
    <Stack>
      <Typography variant='h5' color='secondary' textAlign='center' my={1}>
        Recent Activity
      </Typography>
      <Suspense key='activity' fallback={<LoadingTable />}>
        <BuilderPageTable tab='activity' week={week} userId={user?.id} />
      </Suspense>
    </Stack>
  ) : (
    <Stack>
      <BuilderPageInviteCard isBuilder={isBuilder} />
    </Stack>
  );
}

/* Builder and Scout, Mobile and Desktop */
export function PartnerRewards() {
  return (
    <Stack
      sx={{
        '& .swiper-button-next, & .swiper-button-prev': {
          height: 250,
          top: 125
        }
      }}
    >
      <Typography variant='h5' color='secondary' textAlign='center' my={{ xs: 0.5, md: 1 }}>
        Partner Rewards
      </Typography>
      <PartnerRewardsCarousel />
    </Stack>
  );
}
