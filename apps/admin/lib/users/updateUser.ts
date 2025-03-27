import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function setBuilderStatus(userId: string, status: BuilderStatus) {
  const scout = await prisma.scout.update({ where: { id: userId }, data: { builderStatus: status } });
  if (status === 'applied') {
    await prisma.scout.update({
      where: { id: userId },
      data: { reappliedAt: new Date() }
    });
    log.info(`Developer reapplied`, {
      userId
    });
  }
  return scout;
}
