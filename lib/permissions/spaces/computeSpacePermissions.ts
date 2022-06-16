import { SpaceOperation } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace } from '../../middleware';
import { SpaceMembershipRequiredError } from '../errors';
import { PermissionComputeRequest } from '../interfaces';
import { AvailableSpacePermissions } from './availableSpacePermissions';
import { SpacePermissionFlags } from './interfaces';

export async function computeSpacePermissions ({
  allowAdminBypass,
  resourceId,
  userId
}: PermissionComputeRequest): Promise<SpacePermissionFlags> {

  const allowedOperations = new AvailableSpacePermissions();

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    adminOnly: false
  });

  if (error) {
    // Returns all permissions as false since user is not space member
    return allowedOperations;
  }

  if (isAdmin && allowAdminBypass) {
    allowedOperations.addPermissions(Object.keys(SpaceOperation) as SpaceOperation[]);
    return allowedOperations;
  }

  // Rollup space permissions
  const spacePermissions = await prisma.spacePermission.findMany({
    where: {
      AND: [
        {
          forSpaceId: resourceId
        },
        {
          OR: [
            {
              space: {
                // Extra protection to only consider space roles from the space this permission gives access to
                id: resourceId,
                spaceRoles: {
                  some: {
                    userId
                  }
                }
              }
            },
            // Roles in the space this user has been assigned to
            {
              role: {
                // Extra protection to only query roles belonging to the space
                spaceId: resourceId,
                spaceRolesToRole: {
                  some: {
                    spaceRole: {
                      userId
                    }
                  }
                }
              }
            },
            {
              userId
            }
          ]
        }
      ]

    }
  });

  for (const permissionSet of spacePermissions) {
    allowedOperations.addPermissions(permissionSet.operations);
  }

  return allowedOperations.operationFlags;
}
