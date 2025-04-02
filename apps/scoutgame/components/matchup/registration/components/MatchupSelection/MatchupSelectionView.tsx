import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { MAX_CREDITS } from '@packages/matchup/config';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { TabsMenu } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';

import { AllDevelopersTableServer } from './AllDevelopersTable/AllDeveloperTableServer';
import { MatchupSelectionTabs } from './MatchupSelectionTabs';
import { MyDeveloperCards } from './MyDeveloperCards';

const slots = Array.from({ length: 5 });

export function MatchUpSelectionView({ myMatchup }: { myMatchup: MyMatchup }) {
  const totalCredits = myMatchup.selections?.reduce((acc, selection) => acc + selection.credits, 0) || 0;
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
                color={totalCredits > MAX_CREDITS ? 'error' : 'inherit'}
                gutterBottom
                textTransform='uppercase'
                align='center'
              >
                {totalCredits} / {MAX_CREDITS} credits
              </Typography>
            </Box>
            <Button variant='contained' disabled={myMatchup.selections.length !== 5}>
              Submit
            </Button>
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
        myCardsView={<MyDeveloperCards userId={myMatchup.scout.id} />}
        allCardsView={<AllDevelopersTableServer userId={myMatchup.scout.id} />}
      />
    </Box>
  );
}
