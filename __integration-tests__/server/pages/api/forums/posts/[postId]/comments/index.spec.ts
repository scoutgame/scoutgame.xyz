/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

let space: Space;
let user: User;
let otherUser: User;
let userCookie: string;
let otherUserCookie: string;

let accessiblePostCategory: PostCategory;
let disallowedPostCategory: PostCategory;
beforeAll(async () => {
  const { space: _space, user: _user } = await generateUserAndSpace({ isAdmin: false });
  const { user: _user2 } = await generateUserAndSpace({ isAdmin: false });

  await prisma.spaceRole.create({
    data: {
      spaceId: _space.id,
      userId: _user2.id
    }
  });

  space = _space;
  user = _user;

  otherUser = _user2;

  userCookie = await loginUser(user.id);
  otherUserCookie = await loginUser(otherUser.id);

  accessiblePostCategory = await generatePostCategory({
    spaceId: space.id
  });

  await upsertPostCategoryPermission({
    permissionLevel: 'full_access',
    postCategoryId: accessiblePostCategory.id,
    assignee: { group: 'space', id: space.id }
  });

  disallowedPostCategory = await generatePostCategory({
    spaceId: space.id
  });
});

describe('GET /api/forums/posts/[postId]/comments - Get comments of a post', () => {
  it('should return a list of post comments with vote information, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: accessiblePostCategory.id
    });

    const comments = (
      await request(baseUrl).get(`/api/forums/posts/${post.id}/comments`).set('Cookie', userCookie).expect(200)
    ).body;

    expect(comments).toBeInstanceOf(Array);
  });

  it('should throw an error if user does not have permissions to view this category, responding with 401', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: disallowedPostCategory.id
    });

    await request(baseUrl).get(`/api/forums/posts/${post.id}/comments`).set('Cookie', otherUserCookie).expect(401);
  });
});
describe('POST /api/forums/posts/[postId]/comments - Create a comment', () => {
  it('should create comment, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: accessiblePostCategory.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/comments`)
      .send({
        content: {},
        contentText: '',
        parentId: v4()
      })
      .set('Cookie', userCookie)
      .expect(200);
  });

  it('should throw error if post is not found, responding with 404', async () => {
    await request(baseUrl).post(`/api/forums/posts/${v4()}/comments`).set('Cookie', userCookie).expect(404);
  });

  it(`should throw error if user doesn't have permissions to access the category, responding with 401`, async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: disallowedPostCategory.id
    });

    await request(baseUrl).post(`/api/forums/posts/${post.id}/comments`).send({}).set('Cookie', userCookie).expect(401);
  });
});
