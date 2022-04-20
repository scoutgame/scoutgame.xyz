import { PagePermission } from '@prisma/client';
import { prisma } from 'db';
import { getPage, IPageWithPermissions, PageNotFoundError, resolveChildPages } from 'lib/pages';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { createPagePermission } from './page-permission-actions';
import { permissionTemplates } from './page-permission-mapping';

/**
 * Ensures that a set of comparison permissions contains at least the same or more permissions than the base compared against
 * @abstract There can only be 1 page permission per space, role or user. This is enforced at the database level
 */
export function hasFullSetOfBasePermissions (basePermissions: PagePermission [], comparisonPermissions: PagePermission []): boolean {

  for (const permission of basePermissions) {
    const comparisonPermission = comparisonPermissions.find(permissionToCompare => {

      if (permission.spaceId) {
        return permissionToCompare.spaceId === permission.spaceId;
      }
      else if (permission.roleId) {
        return permissionToCompare.roleId === permission.roleId;
      }
      else if (permission.userId) {
        return permissionToCompare.userId === permission.userId;
      }
      else {
        return false;
      }

    });

    if (!comparisonPermission) {
      return false;
    }

    const availableCompare = new AllowedPagePermissions(comparisonPermission.permissionLevel === 'custom' ? comparisonPermission.permissions : permissionTemplates[permission.permissionLevel]);

    const hasSameOrMore = availableCompare.hasPermissions(permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel]);

    if (hasSameOrMore === false) {
      return false;
    }

  }

  return true;

}

/**
 * @param permissionIdToIgnore A permission Id that will not be compared. Useful when we've just added a new permission and are evaluating children to see if they can inherit it
 */
export async function canInheritPermissionsFromParent (pageId: string, permissionIdToIgnore?: string) {

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // Is a root page
  if (!page.parentId) {
    return false;
  }

  const parentPage = await prisma.page.findUnique({
    where: {
      id: page.parentId
    },
    include: {
      permissions: true
    }
  });

  if (!parentPage) {
    throw new PageNotFoundError(page.parentId);
  }

  const filteredParentPermissions = permissionIdToIgnore ? parentPage.permissions.filter(perm => {
    return perm.id !== permissionIdToIgnore && perm.inheritedFromPermission !== permissionIdToIgnore;
  }) : parentPage.permissions;

  const filteredPagePermissions = permissionIdToIgnore ? page.permissions.filter(perm => {
    return perm.id !== permissionIdToIgnore && perm.inheritedFromPermission !== permissionIdToIgnore;
  }) : page.permissions;

  return hasFullSetOfBasePermissions(filteredParentPermissions, filteredPagePermissions);

}

/**
 * Takes all permissions for a page and makes the page the owner of those permissions
 * Updates children to inherit from this page
 */
export async function breakInheritance (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // List of permission IDs coming from parents, and the new permission children will inherit from
  const newPermissionIdToInheritFrom: {old: string, new: string} [] = [];

  const updatedPermissions = await Promise.all(page.permissions.map(permission => {

    if (permission.inheritedFromPermission) {
      newPermissionIdToInheritFrom.push({
        old: permission.inheritedFromPermission,
        new: permission.id
      });
    }

    return createPagePermission({
      ...permission,
      inheritedFromPermission: null
    });
  }));

  page.permissions = updatedPermissions;

  const childPages = await resolveChildPages(page.id);

  await Promise.all(newPermissionIdToInheritFrom.map(referenceToUpdate => {
    return prisma.pagePermission.updateMany({
      where: {
        AND: [
          {
            OR: childPages.map(child => {
              return { pageId: child.id };
            })
          },
          {
            inheritedFromPermission: referenceToUpdate.old
          }
        ]
      },
      data: {
        inheritedFromPermission: referenceToUpdate.new
      }
    });
  }));

  return page;
}

/**
 * Update all page permissions to the parent permissions
 * @param pageId
 * @param triggeringPermissionId The permission Id we want to add
 */
/*
export async function syncChildPermissions (pageId: string, triggeringPermissionId: string): Promise<IPageWithPermissions & {children: IPageWithPermissions []}> {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const children = await prisma.page.findMany({
    where: {
      parentId: page.id
    },
    include: {
      permissions: true
    }
  });
}
*/
