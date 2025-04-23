'use client';

import { Grid2 as Grid, Skeleton, Stack, Typography } from '@mui/material';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { getServerDate } from '@packages/utils/dates';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { DailyClaimCard } from './DailyClaimCard';

// A time based component needs to be rendered only on the client since the server and client will not match
const NextClaimCountdown = dynamic(() => import('./NextClaimCountdown').then((mod) => mod.NextClaimCountdown), {
  ssr: false,
  loading: () => <Skeleton animation='wave' height={24} width='50%' sx={{ mx: 'auto', my: 0.5 }} />
});

export function DailyClaimGallery({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  const isSequential = isSequentialUpToToday(dailyClaims);
  const currentWeekDay = getServerDate().weekday;
  const canClaimToday = dailyClaims.some(
    (dailyClaim) =>
      dailyClaim.day === currentWeekDay &&
      !dailyClaim.claimed &&
      ((dailyClaim.isBonus && isSequential) || !dailyClaim.isBonus)
  );

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2} p={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Daily Claim
      </Typography>
      <Stack
        component={motion.div}
        whileHover={{ scale: 1, rotate: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
        variants={{
          claim: {
            scale: [1, 1.1, 1, 1.1, 1],
            rotate: [0, -15, 0, 15, 0],
            transition: {
              duration: 2,
              ease: 'easeInOut',
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              repeat: Infinity
            }
          },
          default: { scale: 1, rotate: 0 }
        }}
        animate={canClaimToday ? 'claim' : 'default'}
        width={200}
        height={200}
        alignItems='center'
        justifyContent='center'
        m='auto'
        position='relative'
        sx={{
          opacity: 1,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            opacity: canClaimToday ? 1 : 0.2,
            backgroundImage: 'url(/images/quests/mystery-box.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          },
          '& > *': {
            zIndex: 1
          }
        }}
      >
        {canClaimToday ? null : <NextClaimCountdown />}
      </Stack>
      <Grid container spacing={1} width={280}>
        {dailyClaims.map((dailyClaim) => (
          <Grid size={3} key={`${dailyClaim.day}-${dailyClaim.isBonus}`}>
            <DailyClaimCard
              dailyClaim={dailyClaim}
              hasClaimedStreak={isSequential}
              canClaimBonus={
                isSequential &&
                !!dailyClaim.isBonus &&
                dailyClaims.some((item) => item.day === 7 && !item.isBonus && item.claimed)
              }
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function isSequentialUpToToday(dailyClaims: DailyClaim[]) {
  const serverDate = getServerDate();
  const today = serverDate.weekday || 7; // Sunday returns 0, so we convert it to 7

  return dailyClaims
    .slice(0, today - 1)
    .map((claim) => claim.claimed)
    .every((bool) => bool);
}
