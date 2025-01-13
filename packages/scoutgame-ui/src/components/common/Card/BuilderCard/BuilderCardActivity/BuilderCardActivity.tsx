'use client';

import InfoIcon from '@mui/icons-material/Info';
import type { Theme } from '@mui/material';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
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
  const mdFontSize = size === 'medium' || size === 'large' ? '8.5px' : '7px';

  return (
    <Stack
      flexDirection='row'
      px={0.5}
      pt={{
        xs: 0,
        md: 0.25
      }}
    >
      <Stack flex={1}>
        <Stack>
          <Typography
            fontSize={{
              xs: 7,
              md: mdFontSize
            }}
            fontWeight={500}
            color='secondary'
          >
            WEEK'S GEMS
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
            <Typography
              fontWeight={600}
              fontSize={{
                xs: 11.5,
                md: 15
              }}
              color='secondary'
            >
              {weeksGems}
            </Typography>
            <Image
              width={isMobile ? 12.5 : 15}
              height={isMobile ? 12.5 : 15}
              src='/images/profile/icons/hex-gem-icon.svg'
              alt='scout game icon '
            />
          </Stack>
        </Stack>
        <Box sx={{ backgroundColor: 'primary.main', height: '1px', width: '100%', mb: 0.25 }} />
        <Stack>
          <Typography
            fontSize={{
              xs: 7,
              md: mdFontSize
            }}
            fontWeight={500}
            color='green.main'
          >
            EST. PAYOUT
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
            <Typography
              fontWeight={600}
              fontSize={{
                xs: 11.5,
                md: 15
              }}
              color='green.main'
            >
              {estimatedPayout}
            </Typography>
            <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='scout game icon' />
          </Stack>
        </Stack>
      </Stack>
      <Box sx={{ backgroundColor: 'primary.main', height: '100%', width: '1px' }} />
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
              xs: '6.5px',
              md: mdFontSize
            }
          }}
        >
          14 DAY RANK
        </Typography>
        <Stack width='calc(100% + 5px)' height='100%'>
          <ResponsiveContainer height='100%' width='100%'>
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
        </Stack>
        <Dialog
          open={isDialogOpen}
          onClick={(e) => {
            e.preventDefault();
          }}
          onClose={() => setIsDialogOpen(false)}
          title={
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <InfoIcon color='secondary' />
              <Typography color='secondary' variant='h5'>
                Developer Data
              </Typography>
            </Stack>
          }
        >
          <BuilderCardActivityTooltip />
        </Dialog>
      </Stack>
    </Stack>
  );
}
