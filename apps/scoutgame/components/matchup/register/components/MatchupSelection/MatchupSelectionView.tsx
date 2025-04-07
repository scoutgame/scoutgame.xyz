import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { MAX_CREDITS } from '@packages/matchup/config';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';

import { AllDevelopersTableServer } from './components/AllDevelopersTable/AllDeveloperTableServer';
import { MatchupSelectionTabs } from './components/MatchupSelectionTabs';
import { MyDeveloperCards } from './components/MyDeveloperCards';
import { SubmitMatchupButton } from './components/SubmitMatchupButton';

const slots = Array.from({ length: 5 });

export function MatchUpSelectionView({ myMatchup }: { myMatchup: MyMatchup }) {
  const creditsRemaining =
    MAX_CREDITS - (myMatchup.selections?.reduce((acc, selection) => acc + selection.credits, 0) || 0);

  const canSubmit = myMatchup.selections?.length === 5 && creditsRemaining >= 0;

  return (
    <Box>
      <Typography variant='h5' color='secondary'>
        Select 5 Developers from your Deck:
      </Typography>
      <Card sx={{ mt: 2, p: 2, borderColor: 'secondary.main' }}>
        <Stack direction='row' justifyContent='space-between'>
          <Box flexGrow={1}>
            <Typography color='secondary' variant='h6' gutterBottom textTransform='uppercase'>
              {myMatchup.scout.displayName}'s team
            </Typography>

            {/* Display selected developers or empty slots */}
            {slots.map((_, index) => {
              const { credits, developer } = myMatchup.selections?.[index] || {};

              return (
                <Box
                  key={developer?.id || `empty-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                    // borderBottom: index < 4 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  {developer ? (
                    <>
                      <Box sx={{ mr: 2 }}>
                        <Avatar size='small' name={developer.displayName} src={developer.avatar} alt='' />
                      </Box>
                      <Box sx={{ minWidth: 150 }}>
                        <Typography variant='body1'>{developer.displayName}</Typography>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        {credits} credits
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Box sx={{ mr: 2 }}>
                        <Avatar name='?' size='small' bgcolor='secondary.main' />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant='body1' color='text.disabled'>
                          Select a developer
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
          <Box display='flex' flexDirection='column' alignItems='space-between' minHeight='100%' width={200}>
            <Box flexGrow={1}>
              <Typography color='secondary' variant='h6' gutterBottom textTransform='uppercase' align='center'>
                BALANCE
              </Typography>
              <Typography
                color={creditsRemaining < 0 ? 'error' : 'inherit'}
                gutterBottom
                textTransform='uppercase'
                align='center'
              >
                {creditsRemaining} / {MAX_CREDITS} credits
              </Typography>
            </Box>
            <SubmitMatchupButton matchupId={myMatchup.id} disabled={!canSubmit} />
          </Box>
        </Stack>
      </Card>
      {/* <TabsMenu
        value='my_cards'
        tabs={[
          { value: 'my_cards', label: 'My Cards' },
          { value: 'cards_to_purchase', label: 'All Cards' }
        ]}
      /> */}
      <MatchupSelectionTabs
        myCardsView={
          <MyDeveloperCards
            matchupId={myMatchup.id}
            selectedDevelopers={myMatchup.selections?.map((selection) => selection.developer.id)}
            selectedNfts={myMatchup.selections?.map((selection) => selection.developer.nftId)}
            userId={myMatchup.scout.id}
          />
        }
        allCardsView={<AllDevelopersTableServer userId={myMatchup.scout.id} />}
      />
    </Box>
  );
}
