import type { ScoutProject, ScoutProjectContract, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { projectMinimalSelect, projectDetailedSelect } from './projectSelect';

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
};

export type ScoutProjectMinimal = Pick<ScoutProject, 'id' | 'path' | 'avatar' | 'name'>;

export async function getUserScoutProjects({ userId }: { userId: string }): Promise<ScoutProjectDetailed[]> {
  const scoutProjects = await prisma.scoutProject.findMany({
    where: {
      scoutProjectMembers: {
        some: {
          userId
        }
      },
      deletedAt: null
    },
    select: projectDetailedSelect
  });

  return scoutProjects.map((project) => ({
    ...project,
    contracts: project.scoutProjectContracts,
    teamMembers: project.scoutProjectMembers.map((member) => ({
      id: member.user.id,
      avatar: member.user.avatar ?? '',
      displayName: member.user.displayName,
      role: member.role,
      path: member.user.path
    })),
    deployers: project.scoutProjectDeployers
  }));
}

export async function getUserScoutProjectsInfo({ userId }: { userId: string }): Promise<ScoutProjectMinimal[]> {
  const projects = await prisma.scoutProject.findMany({
    where: {
      scoutProjectMembers: {
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
