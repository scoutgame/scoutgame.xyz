import { QuestionMark } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getEntriesDuringRegistration, type ScoutMatchupEntry } from '@packages/matchup/getEntries';
import { getNextMatchupWeek } from '@packages/matchup/getNextMatchup';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { useEffect, useState } from 'react';

export async function SidebarEntries({ week, weekNumber }: { week: string; weekNumber: number }) {
  const entries = await getEntriesDuringRegistration(week);

  return (
    <>
      <Typography color='text.secondary' align='center'>
        Week {weekNumber} Teams
      </Typography>

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Scout</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align='right'>Gems</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    No entries yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>&ndash;</TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Avatar
                        src={entry.avatar || '/images/default-avatar.png'}
                        alt={entry.displayName}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant='body2'>{entry.displayName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={0.5}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Box
                          key={`${entry.id}`}
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: 'action.disabled',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <QuestionMark sx={{ fontSize: 12 }} />
                        </Box>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align='right'>
                    <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end'>
                      <Typography variant='body2'>&ndash;</Typography>
                      <GemsIcon />
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
