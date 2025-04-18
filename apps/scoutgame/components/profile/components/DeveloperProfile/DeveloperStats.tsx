'use client';

import { Paper, Typography, Stack } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';

import { BuilderCardNftDisplay } from 'components/common/Card/BuilderCard/BuilderCardNftDisplay';

export function DeveloperStats({
  nftImageUrl,
  path,
  builderPoints,
  totalScouts,
  totalNftsSold,
  currentNftPrice,
  isStarterCard
}: {
  nftImageUrl?: string | null;
  path: string;
  builderPoints?: number;
  totalScouts?: number;
  totalNftsSold?: number;
  currentNftPrice?: number | bigint;
  isStarterCard?: boolean;
}) {
  const isDesktop = useMdScreen();

  return (
    <Paper
      sx={{
        py: 2,
        px: 4,
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center'
      }}
      data-test='developer-stats'
    >
      <Stack justifyContent='center'>
        <BuilderCardNftDisplay
          isStarterCard={isStarterCard}
          hideDetails
          nftImageUrl={nftImageUrl}
          path={path}
          size={isDesktop ? 'large' : 'small'}
        />
      </Stack>
      <Stack justifyContent='space-between' gap={2}>
        <Stack justifyContent='center' gap={0.5}>
          <Typography fontWeight={500} color='secondary' variant='subtitle1' align='center'>
            THIS SEASON
          </Typography>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography fontWeight={500} variant='h4' color='orange.main'>
              {builderPoints || 0}
            </Typography>
            <Image src='/images/icons/binoculars-orange.svg' width='25' height='25' alt='scout game icon' />
          </Stack>
          <Typography fontWeight={500} variant='h4' color='orange.main' align='center'>
            {totalScouts || 0} Scouts
          </Typography>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography fontWeight={500} variant='h4' color='orange.main'>
              {totalNftsSold || 0}
            </Typography>
            <Image src='/images/profile/icons/cards-orange.svg' width='20' height='20' alt='cards icon' />
            <Typography fontWeight={500} variant='h4' color='orange.main'>
              Sold
            </Typography>
          </Stack>
        </Stack>
        <Stack justifyContent='center' gap={0.5}>
          <Typography fontWeight={500} color='secondary' variant='subtitle1' align='center'>
            CURRENT CARD PRICE
          </Typography>
          <Typography fontWeight={500} variant='h4' color='orange.main' align='center'>
            {currentNftPrice}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
