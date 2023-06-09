import { InsecureOperationError, InvalidInputError } from '@charmverse/core/errors';
import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposal } from '../createProposal';
import type { ProposalWithUsers } from '../interface';

let user: User;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and proposal in a specific category, accepting page content, reviewers and authors as input', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const { page, workspaceEvent, proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle
      },
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id],
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ]
    });

    expect(page).toMatchObject(
      expect.objectContaining({
        title: pageTitle,
        type: 'proposal'
      })
    );

    expect(proposal).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsers>>({
        authors: [
          {
            proposalId: proposal?.id,
            userId: user.id
          },
          {
            proposalId: proposal?.id,
            userId: extraUser.id
          }
        ],
        reviewers: [
          {
            id: expect.any(String),
            proposalId: proposal?.id as string,
            userId: reviewerUser.id,
            roleId: null
          }
        ]
      })
    );

    expect(workspaceEvent).toMatchObject(
      expect.objectContaining({
        type: 'proposal_status_change'
      })
    );
  });

  it('should throw an error if trying to create a proposal with authors or reviewers outside the space', async () => {
    const { user: outsideUser, space: outsideSpace } = await testUtilsUser.generateUserAndSpace();
    const outsideRole = await testUtilsMembers.generateRole({
      createdBy: outsideUser.id,
      spaceId: outsideSpace.id
    });

    // Outside author
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        categoryId: proposalCategory.id,
        userId: user.id,
        spaceId: space.id,
        authors: [user.id, outsideUser.id],
        reviewers: []
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    // Outside reviewer user
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        categoryId: proposalCategory.id,
        userId: user.id,
        spaceId: space.id,
        authors: [user.id],
        reviewers: [
          {
            group: 'user',
            id: outsideUser.id
          }
        ]
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    // Outside reviewer role
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        categoryId: proposalCategory.id,
        userId: user.id,
        spaceId: space.id,
        authors: [user.id, outsideUser.id],
        reviewers: [
          {
            group: 'role',
            id: outsideRole.id
          }
        ]
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should throw an error if the category is not specified', async () => {
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        categoryId: null as any,
        userId: user.id,
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
