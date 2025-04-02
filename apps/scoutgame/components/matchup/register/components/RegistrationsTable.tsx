import { QuestionMark } from '@mui/icons-material';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getRegistrations } from '@packages/matchup/getRegistrations';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Link from 'next/link';

const selections = Array.from({ length: 5 });

export async function RegistrationsTable({ week, weekNumber }: { week: string; weekNumber: number }) {
  const entries = await getRegistrations(week);

  return (
    <>
      <Typography color='text.secondary' align='center' gutterBottom>
        Week {weekNumber} Teams
      </Typography>

      <TableContainer
        className='contained-table'
        sx={{
          '.MuiTableCell-root': {
            px: 1
          }
        }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>RANK</TableCell>
              <TableCell>SCOUT</TableCell>
              <TableCell>TEAM</TableCell>
              <TableCell align='right'>GEMS</TableCell>
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
                <TableRow key={entry.scout.id}>
                  <TableCell align='center'>&ndash;</TableCell>
                  <TableCell align='center'>
                    <Link href={`/u/${entry.scout.path}`} target='_blank'>
                      <Avatar
                        src={entry.scout.avatar}
                        name={entry.scout.displayName}
                        size='small'
                        sx={{ display: 'inline-flex' }}
                      />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={0.5}>
                      {selections.map((_, i) => (
                        <Box
                          key={entry.scout.id + i.toString()}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '1px',
                            border: '1px solid var(--mui-palette-action-disabled)',
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
