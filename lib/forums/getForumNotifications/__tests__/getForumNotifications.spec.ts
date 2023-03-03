import { v4 } from 'uuid';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import {
  createPost,
  generateForumComment,
  generateUserAndSpaceWithApiToken,
  generateSpaceUser
} from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { getForumNotifications } from '../getForumNotifications';

describe('getForumNotifications', () => {
  it('Should return new notifications from a user that replied directly to a comment', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const postCommenter = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const postCommenter2 = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    const post = await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const firstComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter.id,
      parentId: v4(),
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter2.id,
      parentId: firstComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumNotifications(postCommenter.id);

    // Second comment should have a parent and be a notification
    expect(
      newNotifications.find((notif) => notif.commentId === secondComment.id && notif.postId === post.id)
    ).toBeTruthy();
    expect(newNotifications.length === 1).toBeTruthy();

    // First comment should not be part of marked/unmarked array because it's not the descendent of any comment
    expect(newNotifications.find((notif) => notif.commentId === firstComment.id)).toBeFalsy();
    expect(markedNotifications.length === 0).toBeTruthy();
  });

  it('Should return new notifications to a page author when someone else comments', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const postCommenter = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const postCommenter2 = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    const post = await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const topLevelComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter.id,
      parentId: null,
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter2.id,
      parentId: topLevelComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumNotifications(
      postAuthorAndSpace.user.id
    );

    // Both comments should be unmarked
    expect(newNotifications.some((notif) => notif.commentId === topLevelComment.id && notif.postId === post.id)).toBe(
      true
    );
    expect(newNotifications.some((notif) => notif.commentId === secondComment.id && notif.postId === post.id)).toBe(
      false
    );

    expect(newNotifications.length).toBe(1);
    expect(markedNotifications.length).toBe(0);
  });
});
