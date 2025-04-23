import { Typography, Grid2 as Grid, TableContainer, Table, TableHead, TableRow, TableCell } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { LoadingTableBody } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { Suspense } from 'react';

import { HowToPlayCard } from '../components/HowToPlayCard';
import { RegistrationHeader } from '../components/RegistrationHeader';

import { MatchupLeaderboardTable } from './components/MatchupLeaderboardTable';
import { MatchupLeaderboardTableRows } from './components/MatchupLeaderboardTableRows';
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
                  md: 2
                }
              }
            }}
          >
            <MatchupLeaderboardTable>
              <Suspense fallback={<LoadingTableBody columns={4} />}>
                <MatchupLeaderboardTableRows week={matchup.week} />
              </Suspense>
            </MatchupLeaderboardTable>
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
