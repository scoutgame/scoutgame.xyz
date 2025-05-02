import { Box, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function PublicScoutProfileStats({
  allTimeTokens,
  seasonTokens,
  buildersScouted,
  nftsPurchased
}: {
  allTimeTokens: number;
  seasonTokens: number;
  buildersScouted: number;
  nftsPurchased: number;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box maxWidth={500} mx='auto'>
        <Typography paddingY={1} variant='subtitle1' textAlign='center' color='secondary'>
          THIS SEASON
        </Typography>
        <Stack flexDirection='row' justifyContent='space-between' gap={2}>
          <Stack flexDirection='row' gap={0.5}>
            <Typography color='green.main' variant='subtitle2'>
              {seasonTokens || 0}
            </Typography>
            <Image src='/images/dev-token-logo.png' width='20' height='20' alt='DEV token' />
            <Typography color='green.main' variant='subtitle2'>
              ({allTimeTokens || 0})
            </Typography>
          </Stack>
          <Typography color='green.main' variant='subtitle2'>
            {buildersScouted || 0} Developers
          </Typography>
          <Stack flexDirection='row' gap={0.5}>
            <Typography color='green.main' variant='subtitle2'>
              {nftsPurchased || 0}
            </Typography>
            <Image src='/images/profile/icons/cards-green.svg' width='20' height='20' alt='cards icon' />
            <Typography color='green.main' variant='subtitle2'>
              Held
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
