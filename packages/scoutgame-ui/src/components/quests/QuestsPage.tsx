import { Box, Grid2 as Grid } from '@mui/material';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { DailyClaimGallery } from '@packages/scoutgame-ui/components/quests/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from '@packages/scoutgame-ui/components/quests/QuestsList/QuestsList';

import { Hidden } from '../common/Hidden';

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
    <Grid container spacing={1} data-test='quest-page' overflow='hidden'>
      <Grid size={{ xs: 12, md: 8 }} sx={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <Box maxWidth='500px' margin='0 auto'>
          <Box sx={{ px: 5 }}>
            <DailyClaimGallery dailyClaims={dailyClaims} />
          </Box>
          <Box sx={{ px: 1, mb: 2 }}>
            <QuestsList quests={quests} friends={friends} />
          </Box>
        </Box>
      </Grid>
      <Grid size={{ xs: 0, md: 4 }} data-test='quest-sidebar' sx={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <Hidden mdDown bgcolor='black.main' px={1}>
          <FriendlyQuest friends={friends} title='Friendly Quest' />
        </Hidden>
      </Grid>
    </Grid>
  );
}
