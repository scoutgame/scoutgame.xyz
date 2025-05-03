'use client';

import { Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';

export function PublicBuilderStats({
  allTimeTokens,
  seasonTokens,
  totalScouts,
  totalNftsSold
}: {
  seasonTokens?: number;
  allTimeTokens?: number;
  totalScouts?: number;
  totalNftsSold?: number;
}) {
  const isDesktop = useMdScreen();
  return (
    <Stack gap={0.5}>
      <Typography fontWeight={500} color='secondary' variant={isDesktop ? 'subtitle1' : 'caption'}>
        THIS SEASON
      </Typography>
      {/* <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'body2'} color='orange.main'>
          {seasonPoints || 0}
        </Typography>
        <Image
          src='/images/dev-token-logo.png'
          width={isDesktop ? '25' : '16'}
          height={isDesktop ? '25' : '16'}
          alt='DEV token'
        />
        <Typography fontWeight={500} variant={isDesktop ? 'h6' : 'body2'} color='orange.main'>
          ({allTimePoints || 0})
        </Typography>
      </Stack> */}
      <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'body2'} color='orange.main'>
        {totalScouts || 0} Scouts
      </Typography>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'body2'} color='orange.main'>
          {totalNftsSold || 0}
        </Typography>
        <Image
          src='/images/profile/icons/cards-orange.svg'
          width={isDesktop ? '20' : '14'}
          height={isDesktop ? '20' : '14'}
          alt='cards icon'
        />
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'body2'} color='orange.main'>
          Sold
        </Typography>
      </Stack>
    </Stack>
  );
}
