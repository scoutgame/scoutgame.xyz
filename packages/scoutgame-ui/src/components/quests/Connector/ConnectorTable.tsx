import { Paper, Stack, Table, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import type { TopConnector } from '@packages/scoutgame/topConnector/getTopConnectors';
import Link from 'next/link';

import { StyledTableBody, StyledTableHead } from '../../claim/components/common/StyledTable';
import { Avatar } from '../../common/Avatar';

export function ConnectorTable({ topConnectors = [] }: { topConnectors: TopConnector[] }) {
  const isEmpty = topConnectors.length === 0;

  return (
    <TableContainer component={Paper}>
      <Table>
        <StyledTableHead sx={{ '& .MuiTableCell-root': { width: '33.33%' } }}>
          <TableRow>
            <TableCell align='left'>Scout</TableCell>
            <TableCell align='center'>Rank</TableCell>
            <TableCell align='center'>Referral Points</TableCell>
          </TableRow>
        </StyledTableHead>
        <StyledTableBody sx={{ '& .MuiTableCell-root': { width: '33.33%' } }}>
          {topConnectors?.map((user) => (
            <TableRow key={user.builderId}>
              <TableCell align='left'>
                <Stack component={Link} href={`/u/${user.path}`} alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={user.avatar} name={user.displayName} size='small' />
                  <Typography noWrap variant='caption'>
                    {user.displayName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='center'>{user.rank}</TableCell>
              <TableCell align='center'>{user.referralPoints}</TableCell>
            </TableRow>
          ))}
          {isEmpty && (
            <TableRow>
              <TableCell align='left'>
                <Typography noWrap variant='caption'>
                  ???
                </Typography>
              </TableCell>
              <TableCell align='center'>1</TableCell>
              <TableCell align='center'>???</TableCell>
            </TableRow>
          )}
        </StyledTableBody>
      </Table>
    </TableContainer>
  );
}
