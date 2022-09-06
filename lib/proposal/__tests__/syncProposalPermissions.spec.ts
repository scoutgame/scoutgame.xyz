/* eslint-disable no-loop-func */
import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions } from 'lib/pages/server';
import { typedKeys } from 'lib/utilities/objects';
import { createPage, generateProposal, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ProposalReviewerInput, ProposalWithUsers } from '../interface';
import { syncProposalPermissions, proposalPermissionMapping } from '../syncProposalPermissions';

let space: Space;
let user: User;

beforeAll(async () => {

  const result = await generateUserAndSpaceWithApiToken();

  space = result.space;
  user = result.user;

});

jest.setTimeout(1200000);

describe('syncProposalPagePermissions', () => {

  it('should set permissions for a proposal and its children to the target state for that proposal status', async () => {

    const secondAuthor = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const reviewerUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const reviewerRole = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const authors = [user.id, secondAuthor.id];

    const reviewers: ProposalReviewerInput[] = [{ group: 'user', id: reviewerUser.id }, { group: 'role', id: reviewerRole.id }];

    let proposal = (await generateProposal({
      proposalStatus: 'private_draft',
      spaceId: space.id,
      userId: user.id,
      authors,
      reviewers
    })).proposal as ProposalWithUsers;

    const proposalChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    const proposalSubChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    const proposalStatusKeys = typedKeys(proposalPermissionMapping);

    for (const proposalStatus of proposalStatusKeys) {
      if (proposal?.status !== proposalStatus) {
        proposal = await prisma.proposal.update({
          where: {
            id: proposal.id
          },
          data: {
            status: proposalStatus
          },
          include: {
            authors: true,
            reviewers: true
          }
        });
      }

      await prisma.page.create({
        data: {
          contentText: 'test',
          path: `path-${v4()}`,
          title: 'Title',
          type: 'page',
          updatedBy: user.id,
          author: {
            connect: {
              id: user.id
            }
          },
          space: {
            connect: {
              id: space.id
            }
          },
          permissions: {
            create: {
              permissionLevel: 'view'
            }
          }
        }
      });

      const proposalPage = await syncProposalPermissions({ proposalId: proposal.id });

      const childPage = await getPage(proposalChild.id);

      const subChildPage = await getPage(proposalSubChild.id);

      // Assert correct permissions
      const authorSetting = proposalPermissionMapping[proposalStatus].author;
      const reviewerSetting = proposalPermissionMapping[proposalStatus].reviewer;
      const communitySetting = proposalPermissionMapping[proposalStatus].community;

      ([proposalPage, childPage, subChildPage] as IPageWithPermissions[]).map(page => page.permissions).forEach(permissions => {
        if (authorSetting !== null) {
          authors.forEach(a => {
            expect(permissions.some(p => p.userId === a && p.permissionLevel === authorSetting)).toBe(true);
          });
        }
        else {
          authors.forEach(a => {
            expect(permissions.every(p => p.userId !== a)).toBe(true);
          });
        }

        if (reviewerSetting !== null) {
          reviewers.forEach(r => {
            expect(permissions.some(p => (r.group === 'user' ? p.userId === r.id : p.roleId === r.id) && p.permissionLevel === reviewerSetting)).toBe(true);
          });
        }
        else {
          reviewers.forEach(r => {
            expect(permissions.every(p => (r.group === 'user' ? p.userId !== r.id : p.roleId !== r.id))).toBe(true);
          });
        }

        if (communitySetting !== null) {
          expect(permissions.some(p => p.spaceId === space.id && p.permissionLevel === communitySetting)).toBe(true);
        }
        else {
          expect(permissions.every(p => p.spaceId !== space.id)).toBe(true);
        }
      });
    }

  });
});
