'use client';

import type { Theme } from '@mui/material';
import { Stack, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

import { Dialog } from '../../../Dialog';

import { BuilderCardActivityTooltip } from './BuilderCardActivityTooltip';

export function BuilderCardActivity({
  size,
  last14DaysGems,
  dailyAverageGems
}: {
  dailyAverageGems: number;
  size: 'x-small' | 'small' | 'medium' | 'large';
  last14DaysGems: number[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const gemHeight = size === 'x-small' || size === 'small' ? 12.5 : size === 'medium' ? 14.5 : 16;
  return (
    <>
      <AreaChart
        width={150}
        height={150}
        data={last14DaysGems.map((gems, index) => ({
          name: index,
          value: gems
        }))}
      >
        <Area type='monotone' dataKey='uv' stroke='#69DDFF' fill='#0580A4' />
      </AreaChart>
      <Tooltip title={<BuilderCardActivityTooltip />}>
        <Stack
          flexDirection='row'
          gap={{
            xs: 0.75,
            md: size === 'medium' || size === 'large' ? 1.25 : 0.75
          }}
          width='100%'
          height={gemHeight}
          px={1}
          mt={{
            xs: 0.1,
            md: 0.5
          }}
          alignItems='center'
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
        ></Stack>
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
    </>
  );
}
