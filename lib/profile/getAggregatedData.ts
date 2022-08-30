import { prisma } from 'db';
import { getCompletedApplicationsOfUser } from 'lib/applications/getCompletedApplicationsOfUser';
import log from 'lib/log';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';
import { getAllOrganizations, getProfile } from 'lib/deepdao/client';
import { DeepDaoProfile, DeepDaoVote } from 'lib/deepdao/interfaces';
import { UserCommunity } from './interfaces';

export type AggregatedProfileData = Pick<DeepDaoProfile, 'totalProposals' | 'totalVotes' | 'proposals' | 'votes'> & {
  bounties: number;
  communities: UserCommunity[];
};

export async function getAggregatedData (userPath: string, apiToken?: string): Promise<AggregatedProfileData> {
  const user = await prisma.user.findFirst({
    where: isUUID(userPath as string) ? {
      id: userPath as string
    } : {
      path: userPath as string
    }
  });

  if (!user) {
    throw new DataNotFoundError();
  }

  const profiles = (await Promise.all(
    user.addresses.map(address => getProfile(address, apiToken)
      .catch(error => {
        log.error('Error calling DEEP DAO API', error);
        return null;
      }))
  )).filter(isTruthy);

  const allOrganizations = await getAllOrganizations(apiToken);

  const daoLogos = allOrganizations.data.resources.reduce<Record<string, string | null>>((logos, org) => {
    logos[org.organizationId] = org.logo;
    return logos;
  }, {});

  const [completedBountiesCount, userWorkspaces] = await Promise.all([
    getCompletedApplicationsOfUser(user.id),
    getSpacesOfUser(user.id)
  ]);

  const hiddenItems = (await prisma.profileItem.findMany({
    where: {
      type: 'community'
    },
    select: {
      id: true
    }
  })).map(profileItem => profileItem.id);

  const userVotes = await prisma.vote.findMany({
    where: {
      spaceId: {
        in: userWorkspaces.map(userWorkspace => userWorkspace.id)
      },
      userVotes: {
        some: {
          userId: user.id
        }
      }
    },
    select: {
      spaceId: true,
      description: true,
      title: true,
      id: true,
      createdAt: true,
      userVotes: {
        where: {
          userId: user.id
        },
        select: {
          choice: true
        }
      },
      deadline: true,
      voteOptions: true,
      threshold: true,
      type: true,
      status: true
    }
  });

  const deepDaoCommunities: UserCommunity[] = Object.values(profiles)
    .map(profile => profile.data.organizations
      .map(org => ({
        joinDate: '',
        id: org.organizationId,
        isHidden: hiddenItems.includes(org.organizationId),
        name: org.name,
        // sometimes the logo is just a filename, do some basic validation
        logo: daoLogos[org.organizationId]?.includes('http') ? daoLogos[org.organizationId] : null
      }))).flat();

  const charmVerseCommunities: UserCommunity[] = userWorkspaces.map(userWorkspace => ({
    id: userWorkspace.id,
    isHidden: hiddenItems.includes(userWorkspace.id),
    joinDate: userWorkspace.spaceRoles.find(spaceRole => spaceRole.userId === user.id)?.createdAt.toISOString(),
    name: userWorkspace.name,
    logo: userWorkspace.spaceImage
  }));

  const communities = [...deepDaoCommunities, ...charmVerseCommunities];

  return {
    totalProposals: profiles.reduce((acc, profile) => acc + profile.data.totalProposals, 0),
    totalVotes: profiles.reduce((acc, profile) => acc + profile.data.totalVotes, 0),
    communities,
    // @ts-ignore leave an 'organizations' field to be backwards compatible temporarily until clients update
    organizations: [],
    proposals: profiles.reduce<DeepDaoProfile['proposals']>((proposals, profile) => ([...proposals, ...profile.data.proposals]), []),
    votes: [
      // Deepdao votes
      ...profiles.reduce<DeepDaoProfile['votes']>((votes, profile) => ([...votes, ...profile.data.votes]), []),
      ...userVotes.map(vote => ({
        createdAt: vote.createdAt.toString(),
        description: vote.description ?? '',
        organizationId: vote.spaceId,
        title: vote.title,
        voteId: vote.id,
        successful: vote.status === 'Passed'
      } as DeepDaoVote))
    ],
    bounties: completedBountiesCount
  };
}
