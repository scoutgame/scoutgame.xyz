import type { Space, User, Vote } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { castProposalVote } from 'lib/public-api/castProposalVote';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, UndesirableOperationError } from 'lib/utilities/errors';
import { createProposalWithUsers, createVote, generateUserAndSpace } from 'testing/setupDatabase';

let user: User;
let space: Space;
let proposalId: string;
let vote: Vote;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;

  const proposal = await createProposalWithUsers({
    spaceId: space.id,
    userId: user.id,
    authors: [],
    reviewers: [user.id],
    proposalStatus: 'published'
  });
  proposalId = proposal.id;

  vote = await createVote({
    pageId: proposal.id,
    createdBy: user.id,
    spaceId: space.id,
    voteOptions: ['1', '2', '3']
  });
});

describe('castProposalVote', () => {
  it('should cast a vote for proposal by proposalId', async () => {
    const choice = '1';
    const userVote = await castProposalVote({ userId: user.id, proposalId, choice });

    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices: [choice]
      })
    );
  });

  it('should cast a vote for proposal by proposalId', async () => {
    const proposal2 = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [user.id],
      proposalStatus: 'published'
    });

    await createVote({
      pageId: proposal2.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3']
    });

    const choice = '1';

    await expect(castProposalVote({ userId: user.id, proposalId: proposal2.id, choice })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );
  });

  it('should throw error if proposal does not exist', async () => {
    await expect(castProposalVote({ choice: '4', proposalId: v4(), userId: user.id })).rejects.toBeInstanceOf(
      DataNotFoundError
    );
  });

  it('should throw error if user does not have access to space', async () => {
    await expect(castProposalVote({ choice: '4', proposalId, userId: v4() })).rejects.toBeInstanceOf(
      UserIsNotSpaceMemberError
    );
  });
});
