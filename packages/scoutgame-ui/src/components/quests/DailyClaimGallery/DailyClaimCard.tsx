'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { claimDailyRewardAction } from '@packages/scoutgame/claims/claimDailyRewardAction';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { getCurrentLocalWeek } from '@packages/scoutgame/dates';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useMemo, useRef } from 'react';

import { useUser } from '../../../providers/UserProvider';
import { DailyClaimGift } from '../../claim/components/common/DailyClaimGift';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnimatedContent({ isClaimed, points }: { isClaimed: boolean; points: number }) {
  return (
    <AnimatePresence mode='wait' initial={false}>
      {isClaimed ? (
        <Stack
          key='claimed'
          direction='row'
          gap={0.5}
          alignItems='center'
          zIndex={1}
          position='absolute'
          top={18}
          bottom={0}
          component={motion.div}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Typography fontWeight={600}>{points}</Typography>
          <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={15} height={8.5} />
        </Stack>
      ) : (
        <Stack
          key='unclaimed'
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          zIndex={1}
          top={30}
          bottom={0}
          position='absolute'
        >
          <Image src='/images/quests/question-icon.png' alt='Quest icon' width={24} height={24} />
        </Stack>
      )}
    </AnimatePresence>
  );
}

export function AnimatedGift({
  isClaimed,
  isBonus = false,
  variant
}: {
  isClaimed: boolean;
  isBonus?: boolean;
  variant: 'disabled' | 'secondary' | 'primary';
}) {
  return (
    <AnimatePresence initial={false}>
      {!isClaimed && (
        <Stack sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {isBonus ? (
            <Stack direction='row' gap={0.5} alignItems='flex-end'>
              <DailyClaimGift variant={variant} size={44} />
              <DailyClaimGift variant={variant} size={70} />
              <DailyClaimGift variant={variant} size={44} />
            </Stack>
          ) : (
            <DailyClaimGift variant={variant} size={64} />
          )}
        </Stack>
      )}
    </AnimatePresence>
  );
}

export function AnimatedClaimedIcon({ isClaimed }: { isClaimed: boolean }) {
  return (
    <AnimatePresence>
      {isClaimed && (
        <Stack
          component={motion.div}
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <CheckCircleIcon
            fontSize='small'
            color='secondary'
            data-test='claimed-icon'
            sx={{
              position: 'absolute',
              top: 5,
              right: 5
            }}
          />
        </Stack>
      )}
    </AnimatePresence>
  );
}

export function DailyClaimCard({
  dailyClaim: _dailyClaim,
  hasClaimedStreak
}: {
  dailyClaim: DailyClaim;
  hasClaimedStreak: boolean;
}) {
  const { refreshUser } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const myConfetti = confetti.create(canvasRef.current || undefined, { resize: true });

  const {
    executeAsync: claimDailyReward,
    isExecuting,
    result
  } = useAction(claimDailyRewardAction, {
    onSuccess: () => {
      refreshUser();
    }
  });

  const dailyClaim = useMemo(
    () => (result?.data?.points ? { ..._dailyClaim, claimed: true, points: result?.data?.points } : _dailyClaim),
    [result?.data?.points]
  );

  const currentWeekDay = DateTime.fromJSDate(new Date()).weekday;
  const isPastDay = currentWeekDay > dailyClaim.day;
  const isClaimToday = currentWeekDay === dailyClaim.day;
  const isClaimed = dailyClaim.claimed;
  const canClaim = isClaimToday && !isClaimed && (!dailyClaim.isBonus || hasClaimedStreak);

  function getButtonLabel() {
    if (isClaimToday && !isClaimed) {
      return 'Claim';
    } else if (dailyClaim.isBonus) {
      return hasClaimedStreak ? 'Bonus' : 'Streak broken :(';
    } else {
      return WEEKDAYS[dailyClaim.day - 1];
    }
  }

  function getVariant() {
    if (isPastDay || (dailyClaim.isBonus && !hasClaimedStreak)) {
      return 'disabled';
    } else if (isClaimToday) {
      return 'secondary';
    } else {
      return 'primary';
    }
  }

  async function handleClaim() {
    if (canClaim) {
      await claimDailyReward({
        isBonus: dailyClaim.isBonus,
        dayOfWeek: currentWeekDay,
        week: getCurrentLocalWeek()
      });
      myConfetti({ origin: { x: 0.5, y: 1 }, particleCount: 150 });
    }
  }
  const buttonLabel = getButtonLabel();
  const variant = getVariant();

  return (
    <Stack
      component={motion.div}
      whileTap={{ scale: canClaim ? 0.9 : 1 }}
      sx={{
        backgroundColor: isClaimed
          ? 'background.light'
          : isPastDay || (dailyClaim.isBonus && !hasClaimedStreak)
            ? 'background.dark'
            : isClaimToday
              ? 'secondary.main'
              : 'primary.dark',
        height: 90,
        paddingBottom: 0.25,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative',
        cursor: canClaim ? 'pointer' : 'default'
      }}
      data-test={`daily-claim-${canClaim ? 'enabled' : 'disabled'}`}
      onClick={handleClaim}
    >
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
        animate={canClaim ? 'claim' : 'default'}
        flex={1}
        position='relative'
        alignItems='center'
        justifyContent='center'
        width='100%'
      >
        <AnimatedGift isClaimed={isClaimed} isBonus={dailyClaim.isBonus} variant={variant} />
        <AnimatedClaimedIcon isClaimed={isClaimed} />
        <AnimatedContent isClaimed={isClaimed} points={dailyClaim.points} />
        {isClaimToday && (
          <Stack
            component='canvas'
            ref={canvasRef}
            position='absolute'
            bottom={-150}
            zIndex={100}
            width={300}
            height={300}
          />
        )}
      </Stack>
      <Typography
        variant='body2'
        color={isClaimToday && !isClaimed ? 'secondary.dark' : 'text.primary'}
        fontWeight={600}
      >
        {buttonLabel}
      </Typography>
    </Stack>
  );
}
