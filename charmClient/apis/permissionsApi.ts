import type { PostCategoryPermission } from '@prisma/client';

import * as http from 'adapters/http';
import type {
  AvailablePostCategoryPermissionFlags,
  AvailablePostPermissionFlags
} from 'lib/permissions/forum/interfaces';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { PermissionCompute, PermissionToDelete } from 'lib/permissions/interfaces';

export class PermissionsApi {
  computePostPermissions(postId: string) {
    return http.POST<AvailablePostPermissionFlags>(`/api/permissions/forum/compute-post-permissions`, {
      resourceId: postId
    } as PermissionCompute);
  }

  computePostCategoryPermissions(postCategoryId: string) {
    return http.POST<AvailablePostCategoryPermissionFlags>(`/api/permissions/forum/compute-post-category-permissions`, {
      resourceId: postCategoryId
    } as PermissionCompute);
  }

  addPostCategoryPermission(permissionInput: PostCategoryPermissionInput) {
    return http.POST<PostCategoryPermission>('/api/forum/permissions', permissionInput);
  }

  deletePostCategoryPermission(permissionId: string) {
    return http.DELETE('/api/forum/permissions', { permissionId } as PermissionToDelete);
  }
}
