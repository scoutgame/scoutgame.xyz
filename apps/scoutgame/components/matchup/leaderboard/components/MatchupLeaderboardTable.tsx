import { TableCell, TableRow, Table, TableContainer, TableHead } from '@mui/material';

export function MatchupLeaderboardTable({ children, size }: { children: React.ReactNode; size?: 'small' }) {
  return (
    <Table size={size}>
      <TableHead>
        <TableRow>
          <TableCell align='center'>RANK</TableCell>
          <TableCell>SCOUT</TableCell>
          <TableCell>TEAM</TableCell>
          <TableCell align='right'>GEMS</TableCell>
        </TableRow>
      </TableHead>
      {children}
    </Table>
  );
}
