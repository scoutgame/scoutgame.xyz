import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Paper, Card, CardActionArea, Typography } from '@mui/material';
import { getLeaderboard } from '@packages/matchup/getLeaderboard';
import { getCurrentMatchupDetails } from '@packages/matchup/getMatchupDetails';
import { GemsIcon, PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { List, ListItem } from '@packages/scoutgame-ui/components/common/List';
import Image from 'next/image';

import { ReferenceTime } from 'components/common/ReferenceTime';

export async function WeeklyMatchupCallout() {
  const { weekNumber, registrationOpen, week, matchupPool, opPrize, startTime } = await getCurrentMatchupDetails();
  const leaderboard = registrationOpen ? [] : await getLeaderboard(week, 3);
  return (
    <Card
      sx={{
        borderColor: 'secondary.main',
        mb: 2,
        mt: {
          xs: 0,
          md: 2
        }
      }}
    >
      <CardActionArea href='/matchup' sx={{ p: 2 }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box mr={{ xs: 0, md: 2 }}>
            <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
          </Box>
          <Box display='flex' flexDirection='column' gap={1} flexGrow={1}>
            <Typography variant='h6' color='secondary'>
              Week {weekNumber} Match Up
            </Typography>
            {registrationOpen ? (
              <>
                <Box>
                  <Typography color='secondary' component='span'>
                    🏆 Prize Pool:
                  </Typography>{' '}
                  <Typography component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {matchupPool ? (
                      <>
                        {matchupPool} <PointsIcon /> +{' '}
                      </>
                    ) : null}
                    {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
                  </Typography>
                </Box>
                <Typography variant='body2'>
                  Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
                </Typography>
                <Typography variant='body2' component='em' color='secondary'>
                  <ReferenceTime prefix='Begins in' unixTimestamp={startTime} />
                </Typography>
              </>
            ) : (
              <Box>
                <Typography color='secondary' component='em'>
                  Current Top Teams
                </Typography>
                <List listStyleType='decimal' sx={{ mr: 1, ml: 3 }}>
                  {leaderboard.map((entry, index) => (
                    <ListItem
                      key={entry.scout.id}
                      secondaryAction={
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {entry.totalGemsCollected} <GemsIcon />
                        </Typography>
                      }
                    >
                      {entry.scout.displayName}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
          <ChevronRightIcon fontSize='large' />
        </Box>
      </CardActionArea>
    </Card>
  );
}
