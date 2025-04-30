'use client';

import { Paper, Stack, Tab, Tabs, Typography, tabClasses, tabsClasses } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import type { UserStats } from '@packages/users/getUserStats';
import Image from 'next/image';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { useDevTokenBalance } from 'hooks/useDevTokenBalance';

export function ProfileStats({ seasonPoints, allTimePoints, currentBalance: points }: UserStats) {
  const [selectedDuration, setSelectedDuration] = useState<'season' | 'allTime'>('season');
  const isDesktop = useMdScreen();
  const { address } = useAccount();
  const { formattedBalance } = useDevTokenBalance({ address });

  return (
    <Paper
      sx={{
        px: {
          xs: 1,
          md: 4
        },
        py: {
          xs: 1,
          md: 1.5
        },
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Stack gap={0.5}>
        <Typography variant='subtitle2' textAlign='center' color='secondary'>
          BALANCE
        </Typography>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography variant={isDesktop ? 'h3' : 'h4'} fontWeight={400}>
            {formattedBalance}
          </Typography>
          <Image src='/images/dev-token-logo.png' width='40' height='40' alt='DEV Token' />
        </Stack>
      </Stack>
      <Stack gap={2}>
        <Tabs
          value={selectedDuration}
          aria-label='profile page points duration tabs'
          role='navigation'
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            [`& .${tabsClasses.flexContainer}`]: {
              justifyContent: { md: 'center' }
            },
            [`& .${tabsClasses.indicator}`]: {
              bottom: 3
            },
            [`& .${tabClasses.root}`]: {
              borderBottom: '1px solid',
              borderColor: 'text.primary'
            }
          }}
        >
          <Tab label='Season' onClick={() => setSelectedDuration('season')} value='season' />
          <Tab label='All Time' onClick={() => setSelectedDuration('allTime')} value='allTime' />
        </Tabs>
        <Stack flexDirection='row' gap={2} justifyContent='space-between' px={1}>
          <Stack alignItems='center' gap={0.5}>
            <Typography color='orange.main' variant='subtitle2' fontWeight={500}>
              BUILDING
            </Typography>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Typography variant='h4' color='orange.main' fontWeight={400}>
                {selectedDuration === 'season'
                  ? seasonPoints?.pointsEarnedAsBuilder || 0
                  : allTimePoints?.pointsEarnedAsBuilder || 0}
              </Typography>
              <Image src='/images/dev-token-logo.png' width='25' height='25' alt='DEV token' />
            </Stack>
          </Stack>
          <Stack alignItems='center' gap={0.5}>
            <Typography color='green.main' variant='subtitle2' fontWeight={500}>
              SCOUTING
            </Typography>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Typography variant='h4' color='green.main' fontWeight={400}>
                {selectedDuration === 'season'
                  ? seasonPoints?.pointsEarnedAsScout || 0
                  : allTimePoints?.pointsEarnedAsScout || 0}
              </Typography>
              <Image src='/images/dev-token-logo.png' width='25' height='25' alt='DEV token' />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
