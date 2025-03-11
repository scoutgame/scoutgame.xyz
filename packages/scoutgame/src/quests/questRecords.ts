type QuestRecord = {
  points: number;
  label: string;
  link?: string;
  partner?: string;
  rewards?: string;
  totalSteps?: number;
  tag: string;
  resettable: boolean;
  verifiable: boolean; // whether we can verify the quest completion
};

export type QuestType =
  | 'follow-x-account'
  | 'join-telegram-channel'
  | 'share-x-telegram'
  | 'invite-friend'
  | 'scout-starter-card'
  | 'scout-3-starter-cards'
  | 'scout-full-season-card'
  // | 'enter-op-new-scout-competition'
  | 'scout-5-builders'
  | 'scout-share-builder'
  // | 'scout-moxie-builder'
  | 'share-weekly-claim'
  | 'share-scout-profile'
  | 'verify-email'
  | 'score-first-commit'
  | 'score-first-pr'
  | 'score-streak'
  | 'first-repo-contribution'
  | 'share-builder-profile'
  | 'contribute-celo-repo'
  | 'contribute-game7-repo'
  | 'contribute-octant-repo'
  // | 'contribute-lit-repo'
  | 'link-telegram-account'
  | 'link-farcaster-account';

export type QuestInfo = {
  type: QuestType;
  completed: boolean;
  completedSteps: number | null;
} & QuestRecord;

export const questsRecord: Record<QuestType, QuestRecord> = {
  'follow-x-account': {
    points: 10,
    label: 'Follow @scoutgamexyz',
    link: 'https://x.com/@scoutgamexyz',
    tag: 'scout',
    resettable: false,
    verifiable: false
  },
  'join-telegram-channel': {
    points: 10,
    label: 'Join our Telegram channel',
    link: 'https://t.me/+J0dl4_uswBY2NTkx',
    tag: 'scout',
    resettable: false,
    verifiable: false
  },
  'share-x-telegram': {
    points: 10,
    label: 'Share our Telegram',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(
      "I'm playing @scoutgamexyz on Telegram! 🕹️ Come join me, play in the channel, and discover top builders while earning points and rewards. Let’s scout together! 👉 https://t.me/+J0dl4_uswBY2NTkx #PlayAndEarn"
    )}`,
    tag: 'scout',
    resettable: false,
    verifiable: false
  },
  'invite-friend': {
    points: 0,
    link: '/quests',
    label: 'Refer a Friend',
    tag: 'scout',
    resettable: false,
    verifiable: true
  },
  'scout-starter-card': {
    points: 5,
    label: 'Scout a Starter Card',
    link: '/developers',
    tag: 'scout',
    resettable: true,
    verifiable: true
  },
  'scout-3-starter-cards': {
    label: 'Scout All 3 Starter Cards',
    points: 15,
    link: '/developers',
    totalSteps: 3,
    tag: 'scout',
    resettable: true,
    verifiable: true
  },
  'scout-full-season-card': {
    label: 'Scout a Full Season Card',
    points: 15,
    link: '/developers',
    tag: 'scout',
    resettable: true,
    verifiable: true
  },
  // 'enter-op-new-scout-competition': {
  //   label: 'Enter the OP New Scout Competition',
  //   points: 10,
  //   rewards: 'OP rewards',
  //   partner: 'Optimism',
  //   link: '/info/partner-rewards/optimism',
  //   tag: 'scout',
  //   resettable: true,
  //   verifiable: true
  // },
  'scout-5-builders': {
    label: 'Scout 5 Developers',
    points: 10,
    link: '/developers',
    totalSteps: 5,
    tag: 'scout',
    resettable: true,
    verifiable: true
  },
  'scout-share-builder': {
    label: 'Scout & Share a Developer',
    points: 5,
    link: '/developers',
    tag: 'scout',
    resettable: true,
    verifiable: false
  },
  // 'scout-moxie-builder': {
  //   label: 'Scout a Moxie Developer',
  //   points: 10,
  //   rewards: '$Moxie tokens',
  //   partner: 'Moxie',
  //   link: '/info/partner-rewards/moxie',
  //   tag: 'scout',
  //   resettable: true,
  //   verifiable: true
  // },
  'share-weekly-claim': {
    label: 'Share a Weekly Claim',
    points: 10,
    link: '/claim',
    tag: 'scout',
    resettable: true,
    verifiable: false
  },
  'share-scout-profile': {
    label: 'Share your Scout profile',
    points: 20,
    link: '/profile?tab=scout-build',
    tag: 'scout',
    resettable: true,
    verifiable: false
  },
  'verify-email': {
    label: 'Verify your email',
    points: 10,
    link: '/accounts',
    tag: 'scout',
    resettable: false,
    verifiable: true
  },
  'score-first-commit': {
    label: 'Score Your First Commit',
    points: 10,
    link: '/info/developers',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'score-first-pr': {
    label: 'Score Your First PR',
    points: 15,
    link: '/info/developers',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'score-streak': {
    label: 'Score a Streak',
    points: 20,
    link: '/info/developers',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'first-repo-contribution': {
    label: 'First Contribution to a Repo',
    points: 25,
    link: '/info/developers',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'share-builder-profile': {
    label: 'Share a Developer Profile',
    points: 25,
    link: '/profile?tab=scout-build',
    tag: 'builder',
    resettable: true,
    verifiable: false
  },
  'contribute-celo-repo': {
    label: 'Fix a Celo Issue',
    points: 25,
    rewards: '50-450 cUSD',
    partner: 'Celo',
    link: '/info/partner-rewards/celo',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'contribute-game7-repo': {
    label: 'Contribute to a Game7 Repo',
    points: 25,
    rewards: '$250',
    partner: 'Game7',
    link: '/info/partner-rewards/game7',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  'contribute-octant-repo': {
    label: 'Contribute to a Octant Repo',
    points: 25,
    rewards: '75 USDC',
    partner: 'Octant',
    link: '/info/partner-rewards/octant',
    tag: 'builder',
    resettable: true,
    verifiable: true
  },
  // 'contribute-lit-repo': {
  //   label: 'Merge a PR in the Lit Protocol Repo',
  //   points: 25,
  //   rewards: '$50–$250 USDC',
  //   partner: 'Lit',
  //   link: '/info/partner-rewards/lit',
  //   tag: 'builder',
  //   resettable: true,
  //   verifiable: true
  // },
  'link-farcaster-account': {
    label: 'Link your account with Farcaster',
    points: 10,
    link: '/accounts',
    tag: 'scout',
    resettable: false,
    verifiable: true
  },
  'link-telegram-account': {
    label: 'Link your account with Telegram',
    points: 10,
    link: '/accounts',
    tag: 'scout',
    resettable: false,
    verifiable: true
  }
};

export const resettableQuestTypes = Object.entries(questsRecord)
  .filter(([_, quest]) => quest.resettable)
  .map(([type]) => type);

export const nonResettableQuestTypes = Object.entries(questsRecord)
  .filter(([_, quest]) => !quest.resettable)
  .map(([type]) => type);
