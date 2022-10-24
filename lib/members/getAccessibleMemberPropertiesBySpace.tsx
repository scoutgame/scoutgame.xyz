import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

type GetVisiblePropertiesProps = {
  spaceId: string | string[];
  userId: string | undefined;
}

export function getAccessibleMemberPropertiesBySpace ({ userId, spaceId }: GetVisiblePropertiesProps) {
  if (!userId) {
    return [];
  }

  const spaceIdQuery = typeof spaceId === 'string' ? [spaceId] : spaceId;

  // TODO - handle permissions and select only properties accessible by userId
  return prisma.memberProperty.findMany({
    where: {
      // spaceId: { in: spaceIdQuery }
      OR: [
        {
          spaceId: { in: spaceIdQuery },
          permissions: accessiblePropertiesByPermissionsQuery({
            spaceIds: spaceIdQuery,
            userId
          })
        },
        // Admin override to always return all pages
        {
          space: {
            id: { in: spaceIdQuery },
            spaceRoles: {
              some: {
                userId,
                isAdmin: true
              }
            }
          }
        }
      ]
    },
    orderBy: {
      index: 'asc'
    },
    include: {
      space: true
    }
  });
}

export function accessiblePropertiesByPermissionsQuery ({ spaceIds, userId }:
  { spaceIds: string[], userId: string }): Prisma.MemberPropertyPermissionListRelationFilter {
  return {
    some: {
      OR: [
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId,
                  spaceId: { in: spaceIds }
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
                spaceId: { in: spaceIds }
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
