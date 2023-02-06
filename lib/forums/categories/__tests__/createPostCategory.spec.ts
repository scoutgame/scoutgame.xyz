import type { PostCategory, PostCategoryPermission, Space } from '@prisma/client';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { CreatePostCategoryInput } from '../createPostCategory';
import { createPostCategory } from '../createPostCategory';

let space: Space;

beforeAll(async () => {
  space = (await generateUserAndSpaceWithApiToken()).space;
});
describe('createPostCategory', () => {
  it('should create a post category with an encoded path', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category',
      spaceId: space.id
    };

    const postCategory = await createPostCategory(createInput);

    expect(postCategory).toMatchObject(
      expect.objectContaining<Partial<PostCategory>>({
        ...createInput,
        path: 'test_category'
      })
    );
  });

  it('should create a space / full access permission by default for the post category', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Category with default permission',
      spaceId: space.id
    };

    const category = await createPostCategory(createInput);

    const permissions = await prisma.postCategoryPermission.findMany({
      where: {
        postCategoryId: category.id
      }
    });

    expect(permissions.length).toBe(1);

    const permission = permissions[0];

    expect(permission).toMatchObject(
      expect.objectContaining<PostCategoryPermission>({
        id: expect.any(String),
        spaceId: space.id,
        roleId: null,
        public: null,
        postCategoryId: category.id,
        permissionLevel: 'full_access',
        categoryOperations: [],
        postOperations: []
      })
    );

    await expect(createPostCategory(createInput)).rejects.toThrowError();
  });

  it('should fail to create a post category if one with the same name already exists in this space', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Duplicate Category',
      spaceId: space.id
    };

    await createPostCategory(createInput);

    await expect(createPostCategory(createInput)).rejects.toThrowError();
  });
});
