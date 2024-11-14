import { Box, Stack, Typography } from '@mui/material';
import { LoadingTable } from '@packages/scoutgame-ui/components/claim/components/common/LoadingTable';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/home/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import { Suspense } from 'react';

import { scoutTabs, ScoutTabsMenu } from './ScoutPageTable/components/ScoutTabsMenu';
import { ScoutPageTable } from './ScoutPageTable/ScoutPageTable';

export function ScoutPage({ tab, order, sort }: { tab: string; order: string; sort: string }) {
  const currentTab = scoutTabs.some((t) => t.value === tab) ? tab : 'builders';

  return (
    <Stack>
      <HeaderMessage />
      <Typography variant='h4' color='secondary' textAlign='center' fontWeight='bold' my={2}>
        Scout today's HOT Builders!
      </Typography>
      <Suspense key='todays-hot-builders' fallback={<LoadingCards />}>
        <TodaysHotBuildersCarousel />
      </Suspense>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <ScoutTabsMenu tab={currentTab} />
      </Box>
      <Suspense key={currentTab} fallback={<LoadingTable />}>
        <ScoutPageTable tab={currentTab} order={order} sort={sort} />
      </Suspense>
    </Stack>
  );
}
