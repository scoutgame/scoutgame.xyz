import { PagePermissionLevel, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions, PageNotFoundError, resolveChildPages, resolveParentPages } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';
import { CannotInheritOutsideTreeError, CircularPermissionError, InvalidPermissionGranteeError, InvalidPermissionLevelError, PermissionNotFoundError, SelfInheritancePermissionError } from './errors';
import { IPagePermissionToCreate, IPagePermissionToInherit, IPagePermissionWithAssignee, IPagePermissionWithSource } from './page-permission-interfaces';

export async function listPagePermissions (pageId: string): Promise<IPagePermissionWithAssignee []> {
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId
    },
    include: {
      role: true,
      space: true,
      user: true,
      sourcePermission: true
    }
  });

  return permissions;
}

async function preventCircularPermissionInheritance (permissionIdToInheritFrom: string, targetPageId: string) {

  const sourcePermission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionIdToInheritFrom
    },
    include: {
      sourcePermission: true
    }
  });

  if (!sourcePermission) {
    throw new PermissionNotFoundError(permissionIdToInheritFrom);
  }

  if (sourcePermission.pageId === targetPageId) {
    throw new SelfInheritancePermissionError();
  }

  if (sourcePermission.sourcePermission?.pageId === targetPageId) {
    throw new CircularPermissionError(sourcePermission.id, sourcePermission.sourcePermission.id);
  }

}

/**
 * Creates a permission for a user, role or space, and a pageId
 * Works in upsert mode, ensuring there is always only 1 page permission per user/space/role && page pair
 * @param permission
 * @returns
 */
export async function createPagePermission (permission: IPagePermissionToCreate | IPagePermissionToInherit): Promise<IPagePermissionWithSource> {

  // Split the possible types for later use in this function
  const freshPermission = permission as IPagePermissionToCreate;
  const permissionToInheritFrom = permission as IPagePermissionToInherit;

  // Inherited from will be defined if this is an inheritable permission
  if (permissionToInheritFrom.inheritedFromPermission) {
    await preventCircularPermissionInheritance(permissionToInheritFrom.inheritedFromPermission, permissionToInheritFrom.pageId);
  // We will be creating this permission from scratch. Check it is valid
  }
  else if (
    // Trying to assign to multiple groups at once
    (freshPermission.userId && (freshPermission.roleId || freshPermission.spaceId))
    || (freshPermission.roleId && freshPermission.spaceId)
    // No group assigned
    || (!freshPermission.roleId && !freshPermission.userId && !freshPermission.spaceId)) {
    throw new InvalidPermissionGranteeError();
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const permissionData = permissionToInheritFrom.inheritedFromPermission ? (await prisma.pagePermission.findUnique({
    where: {
      id: permissionToInheritFrom.inheritedFromPermission
    }
  }))! : freshPermission;

  // We only need to store permissions in the database for the custom level.
  // For permission groups, we can simply load the template for that group when evaluating permissions
  const permissionsToAssign = permissionData.permissionLevel === 'custom' ? permissionData.permissions : [];
  const permissionLevel = permissionData.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    throw new InvalidPermissionLevelError(permissionLevel);
  }

  // Only one of the 3 below items will be defined
  const atomicUpdateQuery: Prisma.PagePermissionWhereUniqueInput = {
    userId_PageId: permissionData.userId ? {
      pageId: permission.pageId,
      userId: permissionData.userId
    } : undefined,
    roleId_pageId: permissionData.roleId ? {
      pageId: permission.pageId,
      roleId: permissionData.roleId
    } : undefined,
    spaceId_pageId: permissionData.spaceId ? {
      pageId: permission.pageId,
      spaceId: permissionData.spaceId
    } : undefined
  };

  // Load permission before it is modified
  const permissionBeforeModification = await prisma.pagePermission.findUnique({
    where: atomicUpdateQuery
  });

  const createdPermission = await prisma.pagePermission.upsert({
    where: atomicUpdateQuery,
    include: {
      sourcePermission: true
    },
    update: {
      permissionLevel,
      permissions: permissionsToAssign,
      sourcePermission: !permissionToInheritFrom.inheritedFromPermission
        ? {
          disconnect: true
        }
        : {
          connect: {
            id: permissionToInheritFrom.inheritedFromPermission
          }
        }
    },
    create: {
      permissionLevel,
      permissions: permissionsToAssign,
      page: {
        connect: {
          id: permission.pageId
        }
      },
      user: !permissionData.userId ? undefined : {
        connect: {
          id: permissionData.userId
        }
      },
      role: !permissionData.roleId ? undefined : {
        connect: {
          id: permissionData.roleId
        }
      },
      space: !permissionData.spaceId ? undefined : {
        connect: {
          id: permissionData.spaceId
        }
      },
      sourcePermission: !permissionToInheritFrom.inheritedFromPermission
        ? undefined : {
          connect: {
            id: permissionToInheritFrom.inheritedFromPermission as string
          }
        }
    }
  });

  // Update all permissions that inherit from this
  await prisma.pagePermission.updateMany({
    where: {
      inheritedFromPermission: createdPermission.id
    },
    data: {
      permissionLevel: createdPermission.permissionLevel,
      permissions: createdPermission.permissions
    }
  });

  // Update permissions that inherited from a parent permission
  // The new permission is now the authority as it is closer
  if (permissionBeforeModification?.inheritedFromPermission && !createdPermission.inheritedFromPermission) {

    const childPages = await resolveChildPages(createdPermission.pageId);

    await prisma.pagePermission.updateMany({
      where: {
        AND: [
          {
            OR: childPages.map(child => {
              return { pageId: child.id };
            })
          },
          {
            inheritedFromPermission: permissionBeforeModification.inheritedFromPermission
          }
        ]
      },
      data: {
        permissionLevel: createdPermission.permissionLevel,
        permissions: createdPermission.permissions,
        inheritedFromPermission: createdPermission.id
      }
    });
  }
  // Permission now inherits from parent
  // Children should also inherit
  else if (!permissionBeforeModification?.inheritedFromPermission && createdPermission.inheritedFromPermission) {
    const childPages = await resolveChildPages(createdPermission.pageId);

    await prisma.pagePermission.updateMany({
      where: {
        AND: [
          {
            OR: childPages.map(child => {
              return { pageId: child.id };
            })
          },
          {
            inheritedFromPermission: createdPermission.id
          }
        ]
      },
      data: {
        permissionLevel: createdPermission.permissionLevel,
        permissions: createdPermission.permissions,
        inheritedFromPermission: createdPermission.inheritedFromPermission
      }
    });
  }

  return createdPermission;
}

export async function deletePagePermission (permissionId: string) {

  if (!isTruthy(permissionId)) {
    throw {
      error: 'Please provide a valid permission ID'
    };
  }

  const foundPermission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!foundPermission) {
    throw new PermissionNotFoundError(permissionId);
  }

  // Delete the permission and the permissions
  await prisma.pagePermission.deleteMany({ where: {
    OR: [
      {
        id: permissionId
      }, {
        inheritedFromPermission: permissionId
      }
    ]
  } });

  return true;
}

export async function inheritPermissions (
  sourcePageId: string,
  targetPageId: string
): Promise<IPageWithPermissions> {
  const [sourcePage, targetPage] = await Promise.all([
    getPage(sourcePageId),
    getPage(targetPageId)
  ]);

  if (!sourcePage || !targetPage) {
    throw new PageNotFoundError(!sourcePage ? sourcePageId : targetPageId);
  }

  if (targetPage.parentId !== sourcePage.id) {
    const parentPages = await resolveParentPages(targetPage.id);
    // Make sure the page we want to inherit from is a prent of this page
    const isValidParent = parentPages.some(page => page.id === sourcePage.id);
    if (!isValidParent) {
      throw new CannotInheritOutsideTreeError(sourcePageId, targetPageId);
    }
  }

  const permissionsToCopy = [];

  for (const permission of sourcePage.permissions) {
    const existingPermission = targetPage.permissions.find(targetPermission => {

      if (permission.userId) {
        return targetPermission.userId === permission.userId;
      }
      else
      if (permission.roleId) {
        return targetPermission.roleId === permission.roleId;
      }
      else
      if (permission.spaceId) {
        return targetPermission.spaceId === permission.spaceId;
      }

      return false;

    });

    if (!existingPermission) {

      permissionsToCopy.push(permission);

    // Inherit permissions if there is no permission, or there is a permission for the same group with same access level
    }
    else if (existingPermission && existingPermission.permissionLevel === permission.permissionLevel) {
      await deletePagePermission(existingPermission.id);
      permissionsToCopy.push(permission);
    }
  }

  await Promise.all(permissionsToCopy.map(permission => {
    return createPagePermission({
      inheritedFromPermission: permission.inheritedFromPermission ?? permission.id,
      pageId: targetPageId
    });
  }));

  const updatedTargetPageWithClonedPermissions = await getPage(targetPage.id) as IPageWithPermissions;

  return updatedTargetPageWithClonedPermissions;
}

export async function inheritPermissionsAcrossChildren (
  sourcePageId: string,
  targetPageId: string
): Promise<IPageWithPermissions> {

  const updated = await inheritPermissions(sourcePageId, targetPageId);

  const children = await resolveChildPages(targetPageId);
  await Promise.all(
    children.map(child => {
      return inheritPermissions(sourcePageId, child.id);
    })
  );

  return updated;
}
