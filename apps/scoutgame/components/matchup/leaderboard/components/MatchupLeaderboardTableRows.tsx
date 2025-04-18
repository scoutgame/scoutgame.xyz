import {
  Box,
  Badge,
  Stack,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Table,
  TableContainer,
  TableHead
} from '@mui/material';
import { getMatchupLeaderboard } from '@packages/matchup/getMatchupLeaderboard';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Link from 'next/link';

import { TableCellText } from 'components/common/TableCellText';

import { DeveloperAvatar } from './DeveloperAvatar';

export async function MatchupLeaderboardTableRows({
  week,
  limit,
  size
}: {
  week: string;
  limit?: number;
  size?: 'small';
}) {
  const leaderboardRows = await getMatchupLeaderboard(week, limit);

  return (
    <TableBody>
      {leaderboardRows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4} align='center'>
            <Typography variant='body2' color='text.secondary'>
              No entries yet
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        leaderboardRows.map((entry, index) => (
          <TableRow key={entry.scout.id}>
            <TableCell align='center'>
              <Typography fontSize={{ xs: 14, md: size === 'small' ? 14 : 18 }}>{entry.rank}</Typography>
            </TableCell>
            <TableCell align='center'>
              <Link href={`/u/${entry.scout.path}`} target='_blank'>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent={{ xs: 'center', md: size === 'small' ? 'center' : 'flex-start' }}
                  gap={1}
                  maxWidth={{ md: '160px' }}
                >
                  <Avatar
                    src={entry.scout.avatar}
                    name={entry.scout.displayName}
                    sx={{ display: 'inline-flex' }}
                    size={size}
                  />
                  {size === 'small' ? null : (
                    <TableCellText
                      overflow='hidden'
                      textOverflow='ellipsis'
                      noWrap
                      sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    >
                      {entry.scout.displayName}
                    </TableCellText>
                  )}
                </Box>
              </Link>
            </TableCell>
            <TableCell>
              <Stack direction='row' spacing={0.5}>
                {entry.developers.map((_, i) => (
                  <DeveloperAvatar developer={entry.developers[i]} key={entry.scout.id + i.toString()} size={size} />
                ))}
              </Stack>
            </TableCell>
            <TableCell align='right'>
              <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end'>
                <Typography fontSize={{ xs: 14, md: size === 'small' ? 14 : 18 }}>
                  {entry.totalGemsCollected}
                </Typography>
                <GemsIcon size={size === 'small' ? 20 : 24} />
              </Stack>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );
}
