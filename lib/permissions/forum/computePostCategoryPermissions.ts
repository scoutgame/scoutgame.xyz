import { AvailablePostCategoryPermissions } from '@charmverse/core/permissions';
import type { PostCategoryPermissionFlags } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { PostCategoryNotFoundError } from '@root/lib/forums/categories/errors';
import { hasAccessToSpace } from '@root/lib/users/hasAccessToSpace';
import { InvalidInputError } from '@root/lib/utils/errors';
import { isUUID } from '@root/lib/utils/strings';

import type { PermissionCompute } from '../interfaces';

export async function computePostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PostCategoryPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post category ID: ${resourceId}`);
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: { id: resourceId }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(`${resourceId}`);
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId,
    disallowGuest: true
  });

  const permissions = new AvailablePostCategoryPermissions();

  // Space members can create and edit post categories, people outside the space cannot perform any actions
  if (spaceRole) {
    permissions.addPermissions(['create_post', 'edit_category', 'delete_category', 'view_posts', 'comment_posts']);
  }

  return permissions.operationFlags;
}
