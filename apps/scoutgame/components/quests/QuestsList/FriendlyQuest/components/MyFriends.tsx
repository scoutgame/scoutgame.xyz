import {
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
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import type { Friend } from '@packages/users/getFriends';

export function MyFriends({ friends, title }: { friends: Friend[]; title?: string }) {
  const sorted = friends.sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0));

  if (friends.length === 0) {
    return (
      <Paper
        sx={{
          bgcolor: {
            xs: 'transparent',
            md: 'background.dark'
          },
          flex: 1,
          gap: 2,
          p: {
            xs: 0,
            md: 2
          }
        }}
      >
        <Typography variant='h5' textAlign='center' gutterBottom>
          {title}
        </Typography>
        <Typography variant='body2' textAlign='center'>
          No friends joined through your referral link
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        bgcolor: {
          xs: 'transparent',
          md: 'background.dark'
        },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 2,
        p: {
          xs: 0,
          md: 2
        }
      }}
    >
      <Typography variant='h5' textAlign='center' gutterBottom>
        {title}
      </Typography>
      <Typography variant='body2' textAlign='center'>
        See who's already playing!
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label='Leaderboard table' size='small' sx={{ px: { md: 6 } }} data-test='friends-table'>
          <TableHead>
            <TableRow>
              <TableCell align='left'>FRIEND</TableCell>
              <TableCell align='center'>STATUS</TableCell>
              <TableCell align='right'>TOKENS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.id}>
                <TableCell align='center'>
                  <Stack gap={0.5} flexDirection='row' alignItems='center'>
                    <Avatar src={row.avatar} name={row.displayName} size='small' />
                    <Typography noWrap>{row.displayName}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography textAlign='center' color='secondary'>
                    Recruited
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Stack gap={0.5} flexDirection='row' alignItems='center' justifyContent='right'>
                    <Typography noWrap color='secondary'>
                      {row.currentBalance}
                    </Typography>
                    <img width={20} height={20} src='/images/profile/icons/scout-game-blue-icon.svg' alt='points' />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
