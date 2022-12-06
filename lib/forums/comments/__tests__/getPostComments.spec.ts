import type { Space, User } from '@prisma/client';

import { generatePostComment, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getPostComments } from '../getPostComments';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('getPostComments', () => {
  it('should get all the comments of a post with votes information', async () => {
    const { comment, post } = await generatePostComment({
      userId: user.id,
      spaceId: space.id
    });

    const comments = await getPostComments({
      postId: post.id,
      userId: user.id
    });

    expect(comments).toMatchObject([
      expect.objectContaining({
        id: comment.id,
        upvotes: 0,
        downvotes: 0,
        upvoted: null
      })
    ]);
  });
});
