import { Typography, Grid2 as Grid, TableContainer, Table, TableHead, TableRow, TableCell } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { LoadingTableBody } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { Suspense } from 'react';

import { HowToPlayCard } from '../components/HowToPlayCard';
import { RegistrationHeader } from '../components/RegistrationHeader';

import { MatchupLeaderboardTable } from './components/MatchupLeaderboardTable';
import { MyMatchupResultsTable } from './components/MyMatchupResultsTable';

export function MatchupLeaderboardPage({
  matchup,
  scoutId,
  hasRegistered
}: {
  matchup: MatchupDetails;
  scoutId?: string;
  hasRegistered: boolean;
}) {
  return (
    <PageContainer>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RegistrationHeader matchup={matchup} registered={hasRegistered} />
          <Hidden mdUp>
            <HowToPlayCard registrationOpen={false} />
          </Hidden>
          <Typography color='secondary' variant='h5' sx={{ mb: 2 }} align='center'>
            This Week's Leaderboard
          </Typography>
          <TableContainer
            className='contained-table'
            sx={{
              '.MuiTableHead-root .MuiTableCell-root': {
                py: 0.5
              },
              '.MuiTableCell-root': {
                px: {
                  xs: 0.5,
                  md: 1
                }
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align='center'>RANK</TableCell>
                  <TableCell>SCOUT</TableCell>
                  <TableCell>TEAM</TableCell>
                  <TableCell align='right'>GEMS</TableCell>
                </TableRow>
              </TableHead>
              <Suspense fallback={<LoadingTableBody columns={4} />}>
                <MatchupLeaderboardTable week={matchup.week} />
              </Suspense>
            </Table>
          </TableContainer>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Hidden mdDown>
            <HowToPlayCard registrationOpen={false} />
          </Hidden>
          <Suspense fallback={<div></div>}>
            <MyMatchupResultsTable week={matchup.week} scoutId={scoutId} />
          </Suspense>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
