import { Stack, Typography } from '@mui/material';
import type { QuestInfo } from '@packages/scoutgame/quests/questRecords';

import { Hidden } from '../../common/Hidden';

import type { Friend } from './FriendlyQuest/components/MyFriends';
import { FriendlyQuest } from './FriendlyQuest/FriendlyQuest';
import { QuestAccordion } from './QuestAccordion';
import { QuestCard } from './QuestCard';

export function QuestsList({
  quests,
  friends,
  tokensEarnedFromFriends
}: {
  quests: QuestInfo[];
  friends: Friend[];
  tokensEarnedFromFriends: number;
}) {
  const inviteFriendsQuest = quests.find((quest) => quest.type === 'invite-friend');

  const isFarcasterConnectQuestCompleted = quests.find((quest) => quest.type === 'link-farcaster-account')?.completed;
  const isTelegramConnectQuestCompleted = quests.find((quest) => quest.type === 'link-telegram-account')?.completed;

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} mt={4}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Quests
      </Typography>
      <Stack width='100%' gap={1}>
        <Hidden mdUp>
          {inviteFriendsQuest && (
            <QuestAccordion quest={inviteFriendsQuest}>
              <FriendlyQuest friends={friends} tokensEarned={tokensEarnedFromFriends} />
            </QuestAccordion>
          )}
        </Hidden>
        {quests
          .filter((quest) => {
            const isTelegramQuest = quest.type === 'link-telegram-account';
            const isFarcasterQuest = quest.type === 'link-farcaster-account';
            if (isTelegramQuest && isFarcasterConnectQuestCompleted) {
              return false;
            } else if (isFarcasterQuest && isTelegramConnectQuestCompleted) {
              return false;
            } else if (
              (isFarcasterQuest || isTelegramQuest) &&
              !isFarcasterConnectQuestCompleted &&
              !isTelegramConnectQuestCompleted
            ) {
              return !isTelegramQuest;
            }
            return quest.type !== 'invite-friend';
          })
          .map((quest) => (
            <QuestCard quest={quest} key={quest.type} />
          ))}
      </Stack>
    </Stack>
  );
}
