import { prisma } from '@charmverse/core/prisma-client';

import type { UserScoutProject } from './getUserScoutProjects';
import { projectSelect } from './projectSelect';

export async function getProjectByPath(path: string): Promise<UserScoutProject | null> {
  const scoutProject = await prisma.scoutProject.findUnique({
    where: {
      path
    },
    select: projectSelect
  });

  if (!scoutProject) {
    return null;
  }

  return {
    ...scoutProject,
    contracts: scoutProject.scoutProjectContracts,
    teamMembers: scoutProject.scoutProjectMembers.map((member) => ({
      id: member.user.id,
      avatar: member.user.avatar ?? '',
      displayName: member.user.displayName,
      role: member.role,
      path: member.user.path
    }))
  };
}
