import { Box, Button, Card, Stack, Typography } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { TabsMenu } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';

import { AllDeveloperCards } from './AllDeveloperCards';
import { MatchupSelectionGallery } from './MatchupSelectionGallery';
import { MyDeveloperCards } from './MyDeveloperCards';

export function MatchUpSelectionView({ myMatchup }: { myMatchup: MyMatchup }) {
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
            {Array.from({ length: 5 }).map((_, index) => {
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
                        <Avatar src={developer.avatar || '/images/default-avatar.png'} alt='' />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
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
              <Typography gutterBottom textTransform='uppercase' align='center'>
                {myMatchup.totalScore} / 35 credits
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
      <MatchupSelectionGallery
        myCardsView={<MyDeveloperCards userId={myMatchup.scout.id} />}
        allCardsView={<AllDeveloperCards userId={myMatchup.scout.id} />}
      />
    </Box>
  );
}
