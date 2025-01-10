import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';
import { DailyClaimGallery } from '@packages/scoutgame-ui/components/quests/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from '@packages/scoutgame-ui/components/quests/QuestsList/QuestsList';
import { Suspense } from 'react';

import { ConectorContainer } from './Connector/ConnectorContainer';
import { FriendlyQuest } from './QuestsList/FriendlyQuest';

export function QuestsPage({
  dailyClaims,
  quests,
  friends
}: {
  dailyClaims: DailyClaim[];
  quests: QuestInfo[];
  friends: SessionUser[];
}) {
  return (
    <Grid container data-test='quest-page' overflow='hidden'>
      <Grid
        size={{ xs: 12, md: 8 }}
        sx={{
          height: {
            xs: '100%',
            md: 'calc(100vh - 60px)'
          },
          overflowY: 'auto'
        }}
      >
        <Box maxWidth='500px' margin='0 auto'>
          <Box sx={{ px: 5 }}>
            <Suspense fallback={<Skeleton height={100} width='100%' />}>
              <ConectorContainer />
            </Suspense>
          </Box>
          <Box sx={{ px: 5 }}>
            <DailyClaimGallery dailyClaims={dailyClaims} />
          </Box>
          <Box sx={{ px: 1, mb: 2 }}>
            <QuestsList quests={quests} friends={friends} />
          </Box>
        </Box>
      </Grid>
      <Grid
        size={{ xs: 0, md: 4 }}
        data-test='quest-sidebar'
        bgcolor='black.main'
        sx={{
          height: 'calc(100vh - 60px)',
          overflowY: 'auto',
          display: {
            xs: 'none',
            md: 'block'
          },
          px: 1
        }}
      >
        <FriendlyQuest friends={friends} title='Friendly Quest' />
      </Grid>
    </Grid>
  );
}
