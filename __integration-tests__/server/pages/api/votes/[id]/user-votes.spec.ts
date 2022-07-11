import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { Page, Space, User, Vote } from '@prisma/client';

let page: Page;
let space: Space;
let user: User;
let vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generatedUser;
  space = generatedSpace;

  page = await createPage({
    createdBy: user.id,
    spaceId: space.id
  });

  vote = await createVote({
    createdBy: user.id,
    pageId: page.id,
    spaceId: space.id,
    voteOptions: ['3', '4'],
    userVotes: ['3']
  });

  userCookie = await loginUser(user);
});

describe('GET /api/votes/[id]/user-votes - Get all the user votes casted for an individual vote', () => {
  it('Should get user votes and respond 200', async () => {
    await request(baseUrl).get(`/api/votes/${vote.id}/user-votes`).set('Cookie', userCookie).expect(200);
  });
});
