import { Box, Grid2 as Grid } from '@mui/material';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';
import type { Friend } from '@packages/users/getFriends';

import { DailyClaimGallery } from './DailyClaimGallery/DailyClaimGallery';
import { FriendlyQuest } from './QuestsList/FriendlyQuest/FriendlyQuest';
import { QuestsList } from './QuestsList/QuestsList';

export function QuestsPage({
  dailyClaims,
  quests,
  friends,
  tokensEarnedFromFriends
}: {
  dailyClaims: DailyClaim[];
  quests: QuestInfo[];
  friends: Friend[];
  tokensEarnedFromFriends: number;
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
            <QuestsList quests={quests} friends={friends} tokensEarnedFromFriends={tokensEarnedFromFriends} />
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
        <FriendlyQuest friends={friends} tokensEarned={tokensEarnedFromFriends} title='Friendly Quest' />
      </Grid>
    </Grid>
  );
}
