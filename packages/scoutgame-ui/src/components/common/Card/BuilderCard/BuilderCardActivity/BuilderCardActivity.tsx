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
  estimatedPayout,
  weeksGems
}: {
  weeksGems: number;
  size: 'x-small' | 'small' | 'medium' | 'large';
  last14DaysRank: number[];
  estimatedPayout: number;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  return (
    <Stack flexDirection='row' px={0.25}>
      <Stack flex={1} gap={0.25}>
        <Stack>
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
        <Stack>
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
              {estimatedPayout}
            </Typography>
            <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='scout game icon' />
          </Stack>
        </Stack>
      </Stack>
      <Tooltip title={<BuilderCardActivityTooltip />} style={{ height: '100%', width: '50%' }}>
        <Stack
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
          sx={{
            flex: 1
          }}
        >
          <Typography
            sx={{
              pl: 0.25,
              fontWeight: 500,
              alignSelf: 'flex-start',
              color: 'text.secondary',
              fontSize: {
                xs: '7.5px',
                md: size === 'medium' || size === 'large' ? '10px' : '8px'
              }
            }}
          >
            14 DAY RANK
          </Typography>
          <ResponsiveContainer height='100%' width='104%'>
            <AreaChart
              data={Array.from({ length: 14 }, (_, index) => ({
                name: index,
                value: index * 10
              }))}
            >
              <ReferenceLine y={50} stroke='#FF00D0' />
              <Area type='monotone' dataKey='value' stroke='#69DDFF' fill='#0580A4' />
            </AreaChart>
          </ResponsiveContainer>
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
        </Stack>
      </Tooltip>
    </Stack>
  );
}
