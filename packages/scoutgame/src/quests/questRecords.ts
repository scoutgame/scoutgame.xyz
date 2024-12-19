type QuestRecord = {
  points: number;
  label: string;
  link?: string;
  partner?: string;
  rewards?: string;
  internal?: boolean;
};

export type QuestType =
  | 'follow-x-account'
  | 'share-x-telegram'
  | 'invite-friend'
  | 'scout-starter-card'
  | 'scout-3-starter-cards'
  | 'scout-full-season-card'
  | 'enter-op-new-scout-competition'
  | 'scout-5-builders'
  | 'scout-share-builder'
  | 'scout-moxie-builder'
  | 'share-weekly-claim'
  | 'share-scout-profile';
// | 'link-farcaster-telegram-account';

export type QuestInfo = {
  type: QuestType;
  completed: boolean;
} & QuestRecord;

export const questsRecord: Record<QuestType, QuestRecord> = {
  'follow-x-account': {
    points: 50,
    label: 'Follow @scoutgamexyz',
    link: 'https://x.com/@scoutgamexyz'
  },
  'share-x-telegram': {
    points: 50,
    label: 'Share our Telegram',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(
      "I'm playing @scoutgamexyz on Telegram! 🕹️ Come join me, play in the channel, and discover top builders while earning points and rewards. Let’s scout together! 👉 https://t.me/+J0dl4_uswBY2NTkx #PlayAndEarn"
    )}`
  },
  'invite-friend': {
    points: 20,
    rewards: 'Referral rewards',
    link: '/quests',
    label: 'Refer a Friend'
  },
  'scout-starter-card': {
    points: 5,
    label: 'Scout a Starter Card',
    link: '/builders',
    internal: true
  },
  'scout-3-starter-cards': {
    label: 'Scout All 3 Starter Cards',
    points: 15,
    link: '/builders',
    internal: true
  },
  'scout-full-season-card': {
    label: 'Scout a Full Season Card',
    points: 15,
    link: '/builders',
    internal: true
  },
  'enter-op-new-scout-competition': {
    label: 'Enter the OP New Scout Competition',
    points: 10,
    rewards: 'OP rewards',
    partner: 'Optimism',
    link: '/info/partner-rewards/optimism',
    internal: true
  },
  'scout-5-builders': {
    label: 'Scout 5 Builders',
    points: 10,
    partner: 'GLO',
    rewards: 'GLO (up to 5)',
    link: '/builders',
    internal: true
  },
  'scout-share-builder': {
    label: 'Scout & Share a Builder',
    points: 5,
    link: '/builders',
    internal: true
  },
  'scout-moxie-builder': {
    label: 'Scout a Moxie Builder',
    points: 10,
    rewards: '$Moxie tokens',
    partner: 'Moxie',
    link: '/info/partner-rewards/moxie',
    internal: true
  },
  'share-weekly-claim': {
    label: 'Share a Weekly Claim',
    points: 10,
    link: '/claim',
    internal: true
  },
  'share-scout-profile': {
    label: 'Share your Scout profile',
    points: 20,
    link: '/profile?tab=scout-build',
    internal: true
  }
  // 'link-farcaster-telegram-account': {
  //   label: 'Link your account with Farcaster or Telegram',
  //   points: 10,
  //   link: '/accounts'
  // }
};
