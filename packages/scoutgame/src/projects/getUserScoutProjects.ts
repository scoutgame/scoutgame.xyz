import type { ScoutProject, ScoutProjectContract, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { projectInfoSelect, projectSelect } from './projectSelect';

export type ScoutProjectDetailed = Pick<
  ScoutProject,
  'id' | 'path' | 'avatar' | 'name' | 'description' | 'website' | 'github'
> & {
  contracts: Pick<ScoutProjectContract, 'id' | 'address' | 'chainId'>[];
  teamMembers: {
    id: string;
    path: string;
    avatar: string;
    displayName: string;
    role: ScoutProjectMemberRole;
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
    select: projectSelect
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
    }))
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
    select: projectInfoSelect
  });

  return projects;
}
