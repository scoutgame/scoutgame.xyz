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
              <Typography fontSize={{ xs: 14, md: 18 }}>{entry.rank}</Typography>
            </TableCell>
            <TableCell align='center'>
              <Link href={`/u/${entry.scout.path}`} target='_blank'>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
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
                  <Badge
                    key={entry.scout.id + i.toString()}
                    overlap='rectangular'
                    badgeContent={
                      <Typography
                        variant='caption'
                        sx={{
                          textShadow: '0px 1px 2px rgba(0, 0, 0, 1)',
                          textAlign: 'right',
                          letterSpacing: 0,
                          fontWeight: 800,
                          backgroundColor: '#5C4475',
                          borderRadius: '2px',
                          padding: '0 2px',
                          lineHeight: '1.2em'
                        }}
                      >
                        {entry.developers[i].gemsCollected || 0}
                      </Typography>
                    }
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                    }}
                    slotProps={{
                      badge: {
                        style: {
                          height: 18,
                          paddingRight: 2,
                          transform: 'none'
                        }
                      }
                    }}
                  >
                    <Avatar
                      key={entry.scout.id + i.toString()}
                      src={entry.developers[i].avatar}
                      name={entry.developers[i].displayName}
                      variant='rounded'
                      size='small'
                      sx={{
                        width: size === 'small' ? 30 : 36,
                        height: size === 'small' ? 30 : 36,
                        // borderRadius: '1px',
                        // border: '1px solid var(--mui-palette-action-disabled)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  </Badge>
                ))}
              </Stack>
            </TableCell>
            <TableCell align='right'>
              <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end'>
                <Typography fontSize={{ xs: 14, md: 18 }}>{entry.totalGemsCollected}</Typography>
                <GemsIcon size={24} />
              </Stack>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );
}
