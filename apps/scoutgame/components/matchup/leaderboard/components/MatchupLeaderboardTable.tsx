import {
  Box,
  Badge,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getLeaderboard } from '@packages/matchup/getLeaderboard';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Link from 'next/link';

export async function MatchupLeaderboardTable({ week }: { week: string }) {
  const leaderboardRows = await getLeaderboard(week);

  return (
    <>
      <Typography color='secondary' variant='h5' sx={{ mb: 2 }} align='center'>
        This week's Leaderboard
      </Typography>

      <TableContainer
        className='contained-table'
        sx={{
          '.MuiTableHead-root .MuiTableCell-root': {
            py: 0.5
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
                  <TableCell align='center'>{entry.rank}</TableCell>
                  <TableCell align='center'>
                    <Link href={`/u/${entry.scout.path}`} target='_blank'>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Avatar
                          src={entry.scout.avatar}
                          name={entry.scout.displayName}
                          size='small'
                          sx={{ display: 'inline-flex' }}
                        />
                        <Typography variant='body2'>{entry.scout.displayName}</Typography>
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
                                fontWeight: 800
                              }}
                            >
                              {entry.developers[i].gemsCollected}
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
                              width: 36,
                              height: 36,
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
                      <Typography fontSize={18}>{entry.totalGemsCollected}</Typography>
                      <GemsIcon size={24} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
