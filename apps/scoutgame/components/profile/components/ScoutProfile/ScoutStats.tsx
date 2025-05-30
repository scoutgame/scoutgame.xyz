import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function ScoutStats({
  scoutPoints,
  buildersScouted,
  nftsPurchased
}: {
  scoutPoints?: number;
  buildersScouted: number;
  nftsPurchased: number;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography paddingY={1} variant='subtitle2' textAlign='center' color='secondary'>
        THIS SEASON
      </Typography>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Stack flexDirection='row' gap={1}>
          <Typography color='green.main'>{scoutPoints || 0}</Typography>
          <Image src='/images/dev-token-logo.png' width='25' height='25' alt='DEV token' />
        </Stack>
        <Typography color='green.main'>{buildersScouted || 0} Developers</Typography>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography color='green.main'>{nftsPurchased || 0}</Typography>
          <Image src='/images/profile/icons/cards-green.svg' width='20' height='20' alt='cards icon' />
        </Stack>
      </Stack>
    </Paper>
  );
}
