import type { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import type { IPageWithPermissions, PagesRequest } from '../interfaces';

type PageFieldsWithoutContent = Record<keyof Omit<Page, 'content' | 'contentText'>, true>

/**
 * Utility for getting permissions of a page
 * @returns
 */
export function includePagePermissions (): Prisma.PageInclude & {
  permissions: {
    include: {
      sourcePermission: true;
    };
  };
  } {
  return {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };
}

function selectPageFields (meta: boolean) {
  if (!meta) {
    return {
      include: includePagePermissions()
    };
  }

  const select: { select: PageFieldsWithoutContent } = {
    select: {
      id: true,
      deletedAt: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      title: true,
      headerImage: true,
      icon: true,
      path: true,
      isTemplate: true,
      parentId: true,
      spaceId: true,
      type: true,
      boardId: true,
      autoGenerated: true,
      index: true,
      cardId: true,
      proposalId: true,
      snapshotProposalId: true,
      fullWidth: true,
      bountyId: true,
      hasContent: true,
      galleryImg: true,
      ...includePagePermissions()
    }
  };

  return select;
}

export function accessiblePagesByPermissionsQuery ({ spaceId, userId, omitContent }:
  { spaceId: string, userId: string, omitContent?: boolean }): Prisma.PagePermissionListRelationFilter {
  return {
    some: {
      OR: [
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId,
                  spaceId
                }
              }
            }
          }
        },
        {
          userId
        },
        {
          space: {
            spaceRoles: {
              some: {
                userId,
                spaceId
              }
            }
          }
        },
        {
          public: true
        }
      ]
    }
  };
}

export function generateAccessiblePagesQuery ({ spaceId, userId, archived, meta }: PagesRequest): Prisma.PageFindManyArgs {
  // Return only pages with public permissions
  if (!userId) {
    return {
      where: {
        spaceId,
        permissions: {
          some: {
            public: true
          }
        }
      }
    };
  }

  const archivedQuery = archived ? {
    deletedAt: {
      not: null
    }
  } : {
    deletedAt: null
  };

  return {
    where: {
      OR: [
        {
          spaceId,
          permissions: accessiblePagesByPermissionsQuery({
            spaceId,
            userId
          })
        },
        // Override for proposal templates so any user can instantiate them
        {
          type: 'proposal_template',
          space: {
            id: spaceId,
            spaceRoles: {
              some: {
                userId
              }
            }
          }
        },
        // Admin override to always return all pages
        {
          space: {
            id: spaceId,
            spaceRoles: {
              some: {
                userId,
                isAdmin: true
              }
            }
          }
        }
      ],
      ...archivedQuery
    },
    ...selectPageFields(meta || false)
  };
}

export async function getAccessiblePages ({ spaceId, userId, archived = false, meta = false }: PagesRequest): Promise<IPageWithPermissions[]> {
  return prisma.page.findMany(
    generateAccessiblePagesQuery({ spaceId, userId, archived, meta })
  ) as any as Promise<IPageWithPermissions[]>;
}
