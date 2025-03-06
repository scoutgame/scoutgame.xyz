import { prisma } from '@charmverse/core/prisma-client';
import type {
  ScoutProject,
  ScoutProjectContract,
  ScoutProjectMemberRole,
  Prisma
} from '@charmverse/core/prisma-client';

export const projectMinimalSelect = {
  id: true,
  name: true,
  avatar: true,
  path: true
} satisfies Prisma.ScoutProjectSelect;

export type ScoutProjectDetailed = Pick<
  ScoutProject,
  'id' | 'path' | 'avatar' | 'name' | 'description' | 'website' | 'github'
> & {
  contracts: Pick<ScoutProjectContract, 'id' | 'address' | 'chainId' | 'deployerId'>[];
  teamMembers: {
    id: string;
    path: string;
    avatar: string;
    displayName: string;
    role: ScoutProjectMemberRole;
  }[];
  deployers: {
    id: string;
    address: string;
  }[];
  wallets: {
    address: string;
    chainId: number | null;
    chainType: 'evm' | 'solana' | null;
  }[];
};

export type ScoutProjectMinimal = Pick<ScoutProject, 'id' | 'path' | 'avatar' | 'name'>;

export async function getUserScoutProjectsInfo({ userId }: { userId: string }): Promise<ScoutProjectMinimal[]> {
  const projects = await prisma.scoutProject.findMany({
    where: {
      members: {
        some: {
          userId
        }
      },
      deletedAt: null
    },
    select: projectMinimalSelect
  });

  return projects;
}
