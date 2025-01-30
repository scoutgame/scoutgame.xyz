import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { isProdEnv } from '@packages/utils/constants';

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
  }
};

// Add sepolia testnet to dev and staging env for testing
if (!isProdEnv) {
  chainRecords[11155111] = {
    chainId: 11155111,
    image: '/images/crypto/ethereum-circle.png',
    name: 'Sepolia Testnet'
  };
}

export const ProjectRoleText: Record<ScoutProjectMemberRole, string> = {
  owner: 'Project Owner',
  member: 'Project Member'
};
