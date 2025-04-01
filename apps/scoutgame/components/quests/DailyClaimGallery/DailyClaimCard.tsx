'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { claimDailyRewardAction } from '@packages/scoutgame/claims/claimDailyRewardAction';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { getServerDate } from '@packages/utils/dates';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useRef } from 'react';

import { useGetQuests } from 'hooks/api/quests';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnimatedContent({
  isClaimed,
  canClaim,
  points,
  weekDay,
  canClaimNext,
  isBonus
}: {
  isClaimed: boolean;
  canClaim: boolean;
  canClaimNext: boolean;
  points: number;
  weekDay: string;
  isBonus?: boolean;
}) {
  return (
    <AnimatePresence mode='wait' initial={false}>
      {isClaimed ? (
        <Stack
          key='claimed'
          direction='column'
          alignItems='center'
          component={motion.div}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Stack direction='row' gap={0.5} alignItems='center'>
            <Typography fontWeight={600}>+{points}</Typography>
            <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={15} height={8.5} />
          </Stack>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <CheckCircleIcon
              fontSize='small'
              sx={{ fontSize: isBonus ? 14 : undefined }}
              color='secondary'
              data-test='claimed-icon'
            />
            <Typography variant='body2' sx={{ fontSize: isBonus ? 12 : undefined }}>
              {weekDay}
            </Typography>
          </Stack>
        </Stack>
      ) : canClaim ? (
        <Stack
          key='can-claim'
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          alignItems='center'
        >
          <Typography variant='body2' fontWeight={600}>
            Claim
          </Typography>
        </Stack>
      ) : canClaimNext ? (
        <Stack
          key='unclaimed'
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          alignItems='center'
          gap={0.5}
        >
          <Image src='/images/quests/question-icon.svg' alt='Daily quest unclaimedicon' width={24} height={24} />
          <Typography variant='body2'>{weekDay}</Typography>
        </Stack>
      ) : (
        <Stack
          key='lost'
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          alignItems='center'
          gap={0.5}
        >
          <Image src='/images/quests/question-icon-dark.svg' alt='Daily quest lost icon' width={24} height={24} />
          <Typography variant='body2' color='text.disabled'>
            {weekDay}
          </Typography>
        </Stack>
      )}
    </AnimatePresence>
  );
}

export function DailyClaimCard({
  dailyClaim,
  hasClaimedStreak,
  canClaimBonus
}: {
  dailyClaim: DailyClaim;
  hasClaimedStreak: boolean;
  canClaimBonus: boolean;
}) {
  const serverDate = getServerDate();
  const { refreshUser } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const myConfetti = confetti.create(canvasRef.current || undefined, { resize: true });
  const { mutate: refreshQuests } = useGetQuests();

  const { executeAsync: claimDailyReward } = useAction(claimDailyRewardAction, {
    onSuccess: () => {
      refreshQuests(); // Refresh quests in the entire app
      refreshUser();
    }
  });

  const currentWeekDay = serverDate.weekday;
  const isPastDay = currentWeekDay > dailyClaim.day;
  const isClaimToday = currentWeekDay === dailyClaim.day;
  const isClaimed = dailyClaim.claimed;
  const canClaim = isClaimToday && !isClaimed && ((dailyClaim.isBonus && canClaimBonus) || !dailyClaim.isBonus);
  const canClaimNext = Boolean(
    (!isClaimToday && !isPastDay && !isClaimed && !dailyClaim.isBonus) || (dailyClaim.isBonus && hasClaimedStreak)
  );
  const buttonLabel = dailyClaim.isBonus ? 'Bonus' : WEEKDAYS[dailyClaim.day - 1];
  const claimedBorder = isClaimed ? { border: 'solid 1px', borderColor: 'secondary.main' } : {};

  async function handleClaim() {
    if (canClaim) {
      await claimDailyReward({
        isBonus: dailyClaim.isBonus,
        dayOfWeek: currentWeekDay
      });
      myConfetti({ origin: { x: 0.5, y: 1 }, particleCount: 150 });
    }
  }

  return (
    <Stack
      component={motion.div}
      whileTap={{ scale: canClaim ? 0.9 : 1 }}
      sx={{
        ...claimedBorder,
        backgroundColor: canClaim ? 'primary.main' : 'primary.dark',
        height: 60,
        paddingBottom: 0.25,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative',
        cursor: canClaim ? 'pointer' : 'default'
      }}
      data-test={`daily-claim-${canClaim ? 'enabled' : 'disabled'}`}
      onClick={handleClaim}
    >
      <Stack flex={1} position='relative' alignItems='center' justifyContent='center' width='100%'>
        <AnimatedContent
          isClaimed={isClaimed}
          points={dailyClaim.points}
          weekDay={buttonLabel}
          canClaim={canClaim}
          canClaimNext={canClaimNext}
          isBonus={dailyClaim.isBonus}
        />
        {isClaimToday && !isClaimed && ((dailyClaim.isBonus && canClaimBonus) || !dailyClaim.isBonus) && (
          <Stack
            component='canvas'
            ref={canvasRef}
            position='absolute'
            bottom={-50}
            zIndex={100}
            width={300}
            height={300}
          />
        )}
      </Stack>
    </Stack>
  );
}
