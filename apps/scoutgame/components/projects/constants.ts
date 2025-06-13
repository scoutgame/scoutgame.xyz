import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { isProdEnv } from '@packages/utils/constants';
import { base, baseSepolia, celo, mainnet, optimism, optimismSepolia } from 'viem/chains';

export const chainRecords: Record<
  number,
  {
    chainId: number;
    image: string;
    name: string;
  }
> = {
  167000: {
    chainId: 167000,
    image: '/images/crypto/taiko.png',
    name: 'Taiko'
  },
  // add base, ethereum, and optimism
  [base.id]: {
    chainId: base.id,
    image: '/images/crypto/base.svg',
    name: 'Base'
  },
  [celo.id]: {
    chainId: celo.id,
    image: '/images/crypto/celo.png',
    name: 'Celo'
  },
  [optimism.id]: {
    chainId: optimism.id,
    image: '/images/crypto/op.png',
    name: 'Optimism'
  },
  [mainnet.id]: {
    chainId: mainnet.id,
    image: '/images/crypto/ethereum-circle.png',
    name: 'Ethereum'
  }
};

// Add sepolia testnet to dev and staging env for testing
if (!isProdEnv) {
  chainRecords[11155111] = {
    chainId: 11155111,
    image: '/images/crypto/ethereum-circle.png',
    name: 'Sepolia Testnet'
  };
  // add testnet chains
  chainRecords[baseSepolia.id] = {
    chainId: baseSepolia.id,
    image: '/images/crypto/base.svg',
    name: 'Base Sepolia'
  };
  chainRecords[optimismSepolia.id] = {
    chainId: optimismSepolia.id,
    image: '/images/crypto/op.png',
    name: 'Optimism Sepolia'
  };
}

export const ProjectRoleText: Record<ScoutProjectMemberRole, string> = {
  owner: 'Project Owner',
  member: 'Project Member'
};
