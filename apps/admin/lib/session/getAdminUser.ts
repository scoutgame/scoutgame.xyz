import { prisma } from '@charmverse/core/prisma-client';
import { isProdEnv } from '@packages/utils/constants';

const whitelistedIds: number[] = [472, 4339, 4356, 1212, 318061, 10921, 828888];

export async function getAdminUser({ fid }: { fid: number }) {
  const user = await prisma.scout.findFirstOrThrow({ where: { farcasterId: fid }, select: { id: true } });
  if (!isProdEnv) {
    return user;
  }
  if (whitelistedIds.includes(fid)) {
    return user;
  }
  return null;
}
