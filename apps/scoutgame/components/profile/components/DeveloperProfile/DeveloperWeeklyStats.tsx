import { Paper, Stack, Typography } from '@mui/material';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import Image from 'next/image';

export function DeveloperWeeklyStats({ gemsCollected, rank }: { gemsCollected?: number; rank?: number | null }) {
  const weekNumber = getCurrentSeasonWeekNumber();

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'space-between' }}>
      <Stack gap={1}>
        <Typography variant='h6' style={{ textTransform: 'capitalize' }}>
          {getCurrentSeason().title}
        </Typography>
        <Typography variant='h5' fontWeight={500}>
          WEEK {weekNumber}
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography color='secondary' variant='subtitle2'>
          COLLECTED
        </Typography>
        <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
          <Typography variant='h4'>{gemsCollected || 0}</Typography>
          <Image width={25} height={25} src='/images/icons/gem.svg' alt='Gem' />
        </Stack>
      </Stack>
      <Stack gap={1}>
        <Typography color='secondary' variant='subtitle2'>
          RANK
        </Typography>
        <Typography variant='h4' align='center'>
          {rank && rank !== -1 ? rank : <>&ndash;</>}
        </Typography>
      </Stack>
    </Paper>
  );
}
