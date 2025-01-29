import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';

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

export const ProjectRoleText: Record<ScoutProjectMemberRole, string> = {
  owner: 'Project Owner',
  member: 'Project Member'
};
