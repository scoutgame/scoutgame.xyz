import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { castVote } from '../castVote';

describe('castVote', () => {

  it('should create new user vote if it doesn\'t exist', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: [
        '1', '2', '3'
      ]
    });
    const choice = '1';
    const userVote = await castVote(choice, vote, user.id);
    expect(userVote).toMatchObject(expect.objectContaining({
      userId: user.id,
      voteId: vote.id,
      choice
    }));
  });

  it('should update existing user vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: [
        '1', '2', '3'
      ],
      userVotes: ['1']
    });
    const choice = '3';
    const userVote = await castVote(choice, vote, user.id);
    expect(userVote).toMatchObject(expect.objectContaining({
      userId: user.id,
      voteId: vote.id,
      choice
    }));
  });

  it('should throw error if vote status is cancelled', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      status: 'Cancelled',
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id
    });

    try {
      await castVote('1', vote, v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UndesirableOperationError);
    }
  });

  it('should throw error if vote choice isn\'t one of vote option', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: [
        '1', '2', '3'
      ]
    });

    try {
      await castVote('4', vote, v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });
});
