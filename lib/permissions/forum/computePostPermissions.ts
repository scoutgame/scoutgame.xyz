import type { PostResource } from '@charmverse/core';
import {
  defaultPostPolicies,
  hasAccessToSpace,
  postResolver,
  prisma,
  AvailablePostPermissions
} from '@charmverse/core';

import { PostNotFoundError } from 'lib/forums/posts/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { buildComputePermissionsWithPermissionFilteringPolicies } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import type { PermissionCompute } from '../interfaces';

import type { AvailablePostPermissionFlags } from './interfaces';

export async function baseComputePostPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AvailablePostPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post ID: ${resourceId}`);
  }

  const post = await prisma.post.findUnique({
    where: { id: resourceId },
    select: {
      categoryId: true,
      spaceId: true,
      createdBy: true
    }
  });

  if (!post) {
    throw new PostNotFoundError(`${resourceId}`);
  }

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  const permissions = new AvailablePostPermissions();

  if (post.createdBy === userId) {
    permissions.addPermissions(['edit_post', 'delete_post', 'view_post']);
  }

  // Provide admins with full access
  if (isAdmin) {
    return permissions.full;
    // Always allow space members to interact with posts
  } else if (spaceRole) {
    permissions.addPermissions(['view_post', 'add_comment', 'upvote', 'downvote']);
  } else {
    permissions.addPermissions(['view_post']);
  }

  return permissions.operationFlags;
}
export const computePostPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PostResource,
  AvailablePostPermissionFlags
>({
  resolver: postResolver,
  computeFn: baseComputePostPermissions,
  policies: [...defaultPostPolicies]
});
