'use client';

import type { Theme } from '@mui/material';
import { Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer } from 'recharts';

import { Dialog } from '../../../Dialog';

import { BuilderCardActivityTooltip } from './BuilderCardActivityTooltip';

export function BuilderCardActivity({
  size,
  last14DaysRank,
  estimatePayout,
  weeksGems
}: {
  weeksGems: number;
  size: 'x-small' | 'small' | 'medium' | 'large';
  last14DaysRank: number[];
  estimatePayout: number;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const height = size === 'x-small' || size === 'small' ? 17.5 : size === 'medium' ? 20 : 22.5;
  return (
    <>
      <Tooltip title={<BuilderCardActivityTooltip />}>
        <Stack
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
          sx={{
            width: 'calc(100% + 10px)',
            ml: -0.65,
            mb: -0.5
          }}
        >
          <ResponsiveContainer height={height}>
            <AreaChart
              data={last14DaysRank.map((rank, index) => ({
                name: index,
                value: rank
              }))}
            >
              <ReferenceLine y={50} stroke='#FF00D0' />
              <Area type='monotone' dataKey='value' stroke='#69DDFF' fill='#0580A4' />
            </AreaChart>
          </ResponsiveContainer>
        </Stack>
      </Tooltip>
      <Dialog
        open={isDialogOpen}
        onClick={(e) => {
          e.preventDefault();
        }}
        onClose={() => setIsDialogOpen(false)}
        title='Builder Activity Map'
      >
        <BuilderCardActivityTooltip />
      </Dialog>
      <Stack
        sx={{
          borderWidth: '1.5px 0px 0px 0px',
          borderStyle: 'solid',
          borderColor: '#A06CD5',
          width: '100%',
          flexDirection: 'row',
          px: 0.25,
          gap: 0.5
        }}
      >
        <Stack flex={1}>
          <Typography
            fontSize={{
              xs: 7.5,
              md: 10
            }}
            fontWeight={500}
            color='secondary'
          >
            WEEK'S GEMS
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
            <Typography fontWeight={600} variant='body2' color='secondary'>
              {weeksGems}
            </Typography>
            <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='scout game icon ' />
          </Stack>
        </Stack>
        <Stack
          sx={{
            backgroundColor: '#A06CD5',
            width: '1.5px',
            height: '100%'
          }}
        />
        <Stack flex={1}>
          <Typography
            fontSize={{
              xs: 7.5,
              md: 10
            }}
            fontWeight={500}
            color='green.main'
          >
            EST. PAYOUT
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
            <Typography fontWeight={600} variant='body2' color='green.main'>
              {estimatePayout}
            </Typography>
            <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='scout game icon' />
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
