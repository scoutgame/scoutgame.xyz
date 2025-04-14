import { TableContainer } from '@mui/material';
import { getRegistrations } from '@packages/matchup/getRegistrations';

import { MatchupLeaderboardTable } from 'components/matchup/leaderboard/components/MatchupLeaderboardTable';
import { MatchupLeaderboardTableRows } from 'components/matchup/leaderboard/components/MatchupLeaderboardTableRows';

export async function MatchupWinnersTable({ week, weekNumber }: { week: string; weekNumber: number }) {
  if (weekNumber < 1) {
    return null;
  }
  const entries = await getRegistrations(week);

  return (
    <TableContainer
      className='contained-table'
      sx={{
        '.MuiTableCell-root': {
          px: 1
        }
      }}
    >
      <MatchupLeaderboardTable size='small'>
        <MatchupLeaderboardTableRows week={week} limit={5} size='small' />
      </MatchupLeaderboardTable>
    </TableContainer>
  );
}
