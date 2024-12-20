'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { claimDailyRewardAction } from '@packages/scoutgame/claims/claimDailyRewardAction';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { getCurrentLocalWeek } from '@packages/scoutgame/dates';
import { AnimatePresence, motion } from 'framer-motion';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';

import { useUser } from '../../../providers/UserProvider';
import { DailyClaimGift } from '../../claim/components/common/DailyClaimGift';
import { BoxMotion } from '../../common/Motions/BoxMotion';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DailyClaimCard({
  dailyClaim,
  hasClaimedStreak
}: {
  dailyClaim: DailyClaim;
  hasClaimedStreak: boolean;
}) {
  const { refreshUser } = useUser();
  const {
    execute: claimDailyReward,
    isExecuting,
    result
  } = useAction(claimDailyRewardAction, {
    onSuccess: () => {
      refreshUser();
    }
  });
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

  const buttonLabel = getButtonLabel();
  const variant = getVariant();

  return (
    <Stack
      component={canClaim ? BoxMotion : Stack}
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
      onClick={() => {
        if (canClaim) {
          claimDailyReward({ isBonus: dailyClaim.isBonus, dayOfWeek: currentWeekDay, week: getCurrentLocalWeek() });
        }
      }}
    >
      <Stack
        component={motion.div}
        whileHover={{ scale: 1, rotate: 0, transition: { duration: 0.3, ease: 'easeOut' } }} // Simplified to just stay at normal scale on hover
        animate={
          canClaim
            ? {
                scale: [1, 1.1, 1, 1.1, 1],
                rotate: [0, -15, 0, 15, 0],
                transition: {
                  duration: 2,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  repeat: Infinity
                }
              }
            : undefined
        }
        flex={1}
        position='relative'
        alignItems='center'
        justifyContent='center'
        width='100%'
      >
        {!isClaimed ? (
          <Stack sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {dailyClaim.isBonus ? (
              <Stack direction='row' gap={0.5} alignItems='flex-end'>
                <DailyClaimGift variant={variant} size={44} />
                <DailyClaimGift variant={variant} size={70} />
                <DailyClaimGift variant={variant} size={44} />
              </Stack>
            ) : (
              <DailyClaimGift variant={variant} size={64} />
            )}
          </Stack>
        ) : (
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
        )}
        <AnimatePresence initial={false}>
          {isClaimed ? (
            <Stack
              direction='row'
              gap={0.5}
              alignItems='center'
              zIndex={1}
              top={7.5}
              position='relative'
              component={motion.div}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeIn' }}
            >
              <Typography fontWeight={600}>{dailyClaim.points}</Typography>
              <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={15} height={8.5} />
            </Stack>
          ) : (
            <Stack
              component={motion.div}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: [1.1, 0], opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              zIndex={1}
              top={7.5}
              position='relative'
            >
              <Image src='/images/quests/question-icon.png' alt='Quest icon' width={24} height={24} />
            </Stack>
          )}
        </AnimatePresence>
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
