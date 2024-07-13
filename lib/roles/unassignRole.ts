import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, UndesirableOperationError } from '@root/lib/utils/errors';

import type { RoleAssignment } from './interfaces';
import { listRoleMembers } from './listRoleMembers';

export async function unassignRole({ roleId, userId }: RoleAssignment) {
  const role = await listRoleMembers({ roleId });

  if (role.users.every((u) => u.id !== userId)) {
    throw new InvalidInputError('User is not assigned to this role and cannot be removed from it.');
  }

  if (role.source === 'guild_xyz') {
    throw new UndesirableOperationError('Cannot remove role as it is managed by Guild.xyz');
  }

  if (role.source === 'summon') {
    throw new UndesirableOperationError('Cannot remove role as it is managed by Summon');
  }

  const targetSpaceRole = (await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceRoleToRole: {
        some: {
          roleId: role.id
        }
      }
    }
  })) as SpaceRole;

  await prisma.spaceRoleToRole.delete({
    where: {
      spaceRoleId_roleId: {
        spaceRoleId: targetSpaceRole.id,
        roleId: role.id
      }
    }
  });
}
