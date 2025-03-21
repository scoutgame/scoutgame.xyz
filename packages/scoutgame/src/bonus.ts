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
    icon: 'https://cryptologos.cc/logos/celo-celo-logo.png'
  },
  game7: {
    name: 'Game7',
    icon: 'https://scoutgame.xyz/images/crypto/game7.png'
  },
  // lit_protocol: {
  //   name: 'Lit Protocol',
  //   icon: 'https://scoutgame.xyz/images/logos/lit-protocol.png'
  // },
  op_supersim: {
    name: 'OP Supersim',
    icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  },
  octant: {
    name: 'Octant',
    icon: 'http://scoutgame.xyz/images/logos/octant.png'
  },
  gooddollar: {
    name: 'GoodDollar',
    icon: 'https://scoutgame.xyz/images/logos/good-dollar.png'
  }
} as const;

export type BonusPartner = keyof typeof bonusPartnersRecord;
