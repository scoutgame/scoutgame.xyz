export const partnerRewardRecord: Record<
  string,
  { label: string; icon: string; chain: string; sendNotification?: boolean; partnerLink: string }
> = {
  optimism_new_scout: {
    label: 'New Scout',
    icon: '/images/crypto/op.png',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/optimism',
    chain: 'Optimism',
    sendNotification: true
  },
  optimism_referral_champion: {
    label: 'Referral Champion',
    icon: '/images/crypto/op.png',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/optimism',
    chain: 'Optimism',
    sendNotification: true
  },
  octant_base_contribution: {
    label: 'Octant Base Contribution',
    icon: '/images/crypto/usdc.png',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/octant',
    chain: 'Base',
    sendNotification: true
  },
  gooddollar_contribution: {
    label: 'GoodDollar Contribution',
    icon: '/images/logos/good-dollar.png',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/good-dollar',
    chain: 'Celo',
    sendNotification: true
  },
  matchup_rewards: {
    label: 'Matchup Rewards',
    icon: '/images/crypto/op.png',
    partnerLink: 'https://scoutgame.xyz/matchup',
    chain: 'Optimism'
  },
  matchup_pool_rewards: {
    label: 'Matchup Pool Rewards',
    icon: '/images/dev-token-logo.png',
    partnerLink: 'https://scoutgame.xyz/matchup',
    chain: 'Base'
  }
};

export type PartnerReward = keyof typeof partnerRewardRecord;
