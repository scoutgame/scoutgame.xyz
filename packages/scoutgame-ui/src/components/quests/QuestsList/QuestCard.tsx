'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { completeQuestAction } from '@packages/scoutgame/quests/completeQuestAction';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { useUser } from '../../../providers/UserProvider';

import { QuestIcon } from './QuestsIcons';

export function QuestCard({ quest }: { quest: QuestInfo }) {
  const { refreshUser } = useUser();
  const router = useRouter();
  const { execute, isExecuting } = useAction(completeQuestAction, {
    onSuccess: () => {
      refreshUser();
    }
  });

  const handleClick = async () => {
    if (!quest.internal && !quest.completed && !isExecuting) {
      execute({ questType: quest.type });
    }
    const link = quest.link;
    if (link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        router.push(link);
      }
    }
  };

  return (
    <Button
      disabled={quest.completed}
      onClick={handleClick}
      variant='contained'
      data-test={`quest-${quest.type}`}
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        cursor: !quest.completed ? 'pointer' : 'default',
        bgcolor: quest.completed ? 'background.light' : 'primary.dark',
        borderRadius: 1,
        p: 1.5,
        color: 'text.primary',
        '&.Mui-disabled': {
          color: 'text.primary',
          bgcolor: quest.completed ? 'background.light' : 'primary.main'
        }
      }}
    >
      <Stack direction='row' gap={3} alignItems='center'>
        {QuestIcon[quest.type]}
        <Stack gap={1}>
          <Stack>
            <Typography fontWeight={500} textAlign='left'>
              {quest.label}
            </Typography>
          </Stack>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <Typography variant='body2' fontWeight={500}>
              +{quest.points}
            </Typography>
            <Image src='/images/profile/scout-game-profile-icon.png' alt='Scoutgame icon' width={18.5} height={12} />
            {quest.rewards && (
              <>
                <span>+</span>
                <Typography variant='body2' textAlign='left'>
                  {quest.rewards}
                </Typography>
              </>
            )}
          </Stack>
          {quest.completedSteps !== null ? (
            <Stack flexDirection='row' gap={0.5} alignItems='center'>
              <Typography variant='body2' fontWeight={500} textAlign='left'>
                {quest.completedSteps}
              </Typography>
              <Stack flexDirection='row' gap={0.5} alignItems='center' position='relative' width={150}>
                <div
                  style={{
                    width: `${(quest.completedSteps / (quest.totalSteps || 1)) * 100}%`,
                    height: 14,
                    backgroundColor: 'white',
                    position: 'absolute',
                    left: 0
                  }}
                />
                <div style={{ width: '100%', height: 14, border: '1px solid white', position: 'absolute', left: 0 }} />
              </Stack>
              <Typography variant='body2' fontWeight={500} textAlign='left'>
                {quest.totalSteps || 1}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
      <Stack direction='row' gap={0.5} alignItems='center'>
        <Chip size='small' label={quest.tag.charAt(0).toUpperCase() + quest.tag.slice(1)} />
        {quest.completed ? <CheckCircleIcon color='secondary' /> : <KeyboardArrowRightIcon />}
      </Stack>
    </Button>
  );
}
