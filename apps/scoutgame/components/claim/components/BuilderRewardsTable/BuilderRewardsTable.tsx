import { Paper, Stack, Table, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import Image from 'next/image';

export async function BuilderRewardsTable() {
  return (
    <Stack gap={1} alignItems='center'>
      <Typography color='secondary' variant='h6'>
        Builder Rewards
      </Typography>
      <Table>
        <TableHead
          sx={{
            backgroundColor: 'background.dark',
            '& .MuiTableCell-root': { padding: 1, borderBottom: 'none', textTransform: 'uppercase' }
          }}
        >
          <TableRow>
            <TableCell align='left'>Builder</TableCell>
            <TableCell align='center'>Cards Held</TableCell>
            <TableCell align='center'>Rank</TableCell>
            <TableCell align='right'>Points</TableCell>
          </TableRow>
        </TableHead>
      </Table>
      <Paper
        sx={{
          width: '100%',
          px: 2.5,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          mt: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.dark'
        }}
      >
        <Typography>Time to scout some Builders!</Typography>
        <Image src='/images/cat-with-binoculars.png' alt='Scouts' width={400} height={400} />
      </Paper>
    </Stack>
  );
}
