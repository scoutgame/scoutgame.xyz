export const bonusPartnersRecord = {
  // optimism: {
  //   name: 'Optimism',
  //   // repos: ['optimism-labs/optimism', 'optimism-labs/optimism-monorepo'],
  //   icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  // },
  // polygon: {
  //   name: 'Polygon',
  //   // repos: ['polygon-edge/polygon-edge'],
  //   icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  // },
  celo: {
    name: 'Celo',
    icon: 'https://scoutgame.xyz/images/crypto/celo.png'
  },
  // game7: {
  //   name: 'Game7',
  //   icon: 'https://scoutgame.xyz/images/crypto/game7.png'
  // },
  // lit_protocol: {
  //   name: 'Lit Protocol',
  //   icon: 'https://scoutgame.xyz/images/logos/lit-protocol.png'
  // },
  op_supersim: {
    name: 'OP Supersim',
    icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  },
  // octant: {
  //   name: 'Octant',
  //   icon: 'http://scoutgame.xyz/images/logos/octant.png'
  // },
  gooddollar: {
    name: 'GoodDollar',
    icon: 'https://scoutgame.xyz/images/logos/good-dollar.png'
  }
} as const;

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

export type BonusPartner = keyof typeof bonusPartnersRecord;
export type PartnerReward = keyof typeof partnerRewardRecord;
