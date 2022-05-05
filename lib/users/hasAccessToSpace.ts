import { prisma } from 'db';
import { InvalidInputError, SystemError } from 'lib/utilities/errors';
import { AdministratorOnlyError, UserIsNotSpaceMemberError } from './errors';

interface Input {
  userId: string;
  spaceId: string;
  adminOnly?: boolean;
}

interface Result {
  error?: SystemError;
  success?: boolean;
}

export async function hasAccessToSpace ({ userId, spaceId, adminOnly = false }: Input): Promise<Result> {

  if (!spaceId || !userId) {
    return { error: new InvalidInputError('User ID and space ID are required') };
  }

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });
  if (!spaceRole) {
    return { error: new UserIsNotSpaceMemberError() };
  }
  else if (adminOnly && spaceRole.isAdmin !== true) {
    return { error: new AdministratorOnlyError() };
  }
  return { success: true };
}
