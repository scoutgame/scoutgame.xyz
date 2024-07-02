import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';

type ProjectMember = {
  fid: number;
  pfpUrl: string;
  bio: string;
  username: string;
  displayName: string;
};

export type ConnectProjectDetails = Pick<
  Project,
  | 'id'
  | 'description'
  | 'avatar'
  | 'coverImage'
  | 'category'
  | 'name'
  | 'farcasterValues'
  | 'github'
  | 'mirror'
  | 'twitter'
  | 'websites'
> & {
  projectMembers: {
    farcasterUser: ProjectMember;
  }[];
};

export async function fetchProject(projectId: string): Promise<ConnectProjectDetails | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true,
      description: true,
      avatar: true,
      coverImage: true,
      name: true,
      category: true,
      farcasterValues: true,
      github: true,
      mirror: true,
      twitter: true,
      websites: true,
      projectMembers: {
        select: {
          user: {
            select: {
              farcasterUser: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  return {
    ...project,
    projectMembers: project.projectMembers.map((member) => {
      const farcasterUser = member.user?.farcasterUser?.account as unknown as StatusAPIResponse;
      return {
        ...member.user,
        farcasterUser: {
          fid: member.user?.farcasterUser?.fid,
          pfpUrl: farcasterUser?.pfpUrl,
          bio: farcasterUser?.bio,
          username: farcasterUser?.username,
          displayName: farcasterUser?.displayName
        } as ProjectMember
      };
    })
  };
}
