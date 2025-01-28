import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { projectInfoSelect, projectSelect } from './projectSelect';

export type UserScoutProject = {
  id: string;
  path: string;
  avatar: string;
  name: string;
  description: string;
  website: string;
  github: string;
  contracts: {
    id: string;
    address: string;
    chainId: number;
  }[];
  teamMembers: {
    id: string;
    avatar: string;
    displayName: string;
    role: ScoutProjectMemberRole;
  }[];
};

export type UserScoutProjectInfo = {
  id: string;
  path: string;
  avatar: string;
  name: string;
};

export async function getUserScoutProjects({ userId }: { userId: string }): Promise<UserScoutProject[]> {
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
      role: member.role
    }))
  }));
}

export async function getUserScoutProjectsInfo({ userId }: { userId: string }): Promise<UserScoutProjectInfo[]> {
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
