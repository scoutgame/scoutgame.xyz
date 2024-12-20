type QuestRecord = {
  points: number;
  label: string;
  link?: string;
  partner?: string;
  rewards?: string;
  internal?: boolean;
  totalSteps?: number;
  tag: string;
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
  | 'share-scout-profile'
  | 'score-first-commit'
  | 'score-first-pr'
  | 'score-streak'
  | 'first-repo-contribution'
  | 'share-builder-profile'
  | 'contribute-celo-repo'
  | 'contribute-game7-repo'
  | 'contribute-lit-repo';
// | 'link-farcaster-telegram-account';

export type QuestInfo = {
  type: QuestType;
  completed: boolean;
  completedSteps: number | null;
} & QuestRecord;

export const questsRecord: Record<QuestType, QuestRecord> = {
  'follow-x-account': {
    points: 50,
    label: 'Follow @scoutgamexyz',
    link: 'https://x.com/@scoutgamexyz',
    tag: 'scout'
  },
  'share-x-telegram': {
    points: 50,
    label: 'Share our Telegram',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(
      "I'm playing @scoutgamexyz on Telegram! 🕹️ Come join me, play in the channel, and discover top builders while earning points and rewards. Let’s scout together! 👉 https://t.me/+J0dl4_uswBY2NTkx #PlayAndEarn"
    )}`,
    tag: 'scout'
  },
  'invite-friend': {
    points: 5,
    link: '/quests',
    label: 'Refer a Friend',
    tag: 'scout'
  },
  'scout-starter-card': {
    points: 5,
    label: 'Scout a Starter Card',
    link: '/builders',
    internal: true,
    tag: 'scout'
  },
  'scout-3-starter-cards': {
    label: 'Scout All 3 Starter Cards',
    points: 15,
    link: '/builders',
    internal: true,
    totalSteps: 3,
    tag: 'scout'
  },
  'scout-full-season-card': {
    label: 'Scout a Full Season Card',
    points: 15,
    link: '/builders',
    internal: true,
    tag: 'scout'
  },
  'enter-op-new-scout-competition': {
    label: 'Enter the OP New Scout Competition',
    points: 10,
    rewards: 'OP rewards',
    partner: 'Optimism',
    link: '/info/partner-rewards/optimism',
    internal: true,
    tag: 'scout'
  },
  'scout-5-builders': {
    label: 'Scout 5 Builders',
    points: 10,
    partner: 'GLO',
    rewards: 'GLO (up to 5)',
    link: '/builders',
    internal: true,
    totalSteps: 5,
    tag: 'scout'
  },
  'scout-share-builder': {
    label: 'Scout & Share a Builder',
    points: 5,
    link: '/builders',
    internal: true,
    tag: 'scout'
  },
  'scout-moxie-builder': {
    label: 'Scout a Moxie Builder',
    points: 10,
    rewards: '$Moxie tokens',
    partner: 'Moxie',
    link: '/info/partner-rewards/moxie',
    internal: true,
    tag: 'scout'
  },
  'share-weekly-claim': {
    label: 'Share a Weekly Claim',
    points: 10,
    link: '/claim',
    internal: true,
    tag: 'scout'
  },
  'share-scout-profile': {
    label: 'Share your Scout profile',
    points: 20,
    link: '/profile?tab=scout-build',
    internal: true,
    tag: 'scout'
  },
  'score-first-commit': {
    label: 'Score Your First Commit',
    points: 10,
    link: '/info/builders',
    internal: true,
    tag: 'builder'
  },
  'score-first-pr': {
    label: 'Score Your First PR',
    points: 15,
    link: '/info/builders',
    internal: true,
    tag: 'builder'
  },
  'score-streak': {
    label: 'Score a Streak',
    points: 20,
    link: '/info/builders',
    internal: true,
    tag: 'builder'
  },
  'first-repo-contribution': {
    label: 'First Contribution to a Repo',
    points: 25,
    link: '/info/builders',
    internal: true,
    tag: 'builder'
  },
  'share-builder-profile': {
    label: 'Share a Builder Profile',
    points: 25,
    link: '/profile?tab=scout-build',
    internal: true,
    tag: 'builder'
  },
  'contribute-celo-repo': {
    label: 'Fix a Celo Issue',
    points: 25,
    rewards: '50-450 cUSD',
    partner: 'Celo',
    link: '/info/partner-rewards/celo',
    internal: true,
    tag: 'builder'
  },
  'contribute-game7-repo': {
    label: 'Contribute to a Game7 Repo',
    points: 25,
    rewards: '$250',
    partner: 'Game7',
    link: '/info/partner-rewards/game7',
    internal: true,
    tag: 'builder'
  },
  'contribute-lit-repo': {
    label: 'Merge a PR in the Lit Protocol Repo',
    points: 25,
    rewards: '$50–$250 USDC',
    partner: 'Lit',
    link: '/info/partner-rewards/lit',
    internal: true,
    tag: 'builder'
  }
  // 'link-farcaster-telegram-account': {
  //   label: 'Link your account with Farcaster or Telegram',
  //   points: 10,
  //   link: '/accounts'
  // }
};
