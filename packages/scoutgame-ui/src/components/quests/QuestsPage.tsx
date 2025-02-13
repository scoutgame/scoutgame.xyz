import { Box, Grid2 as Grid } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';
import type { TopConnector } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DailyClaimGallery } from '@packages/scoutgame-ui/components/quests/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from '@packages/scoutgame-ui/components/quests/QuestsList/QuestsList';

import { Connector } from './Connector/TopConnector';
import { FriendlyQuest } from './QuestsList/FriendlyQuest';

export function QuestsPage({
  dailyClaims,
  quests,
  friends,
  topConnectors
}: {
  dailyClaims: DailyClaim[];
  quests: QuestInfo[];
  friends: SessionUser[];
  topConnectors: TopConnector[];
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
        <Box maxWidth='600px' margin='0 auto'>
          <Box>
            <DailyClaimGallery dailyClaims={dailyClaims} />
          </Box>
          <Box sx={{ px: 1, mb: 2 }}>
            <QuestsList quests={quests} friends={friends} topConnectors={topConnectors} />
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
        <Connector topConnectors={topConnectors} />
        <FriendlyQuest friends={friends} title='Friendly Quest' />
      </Grid>
    </Grid>
  );
}
