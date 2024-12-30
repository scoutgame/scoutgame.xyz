import { prisma } from '@charmverse/core/prisma-client';

export async function query() {
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      path: 'felipe.cremin89'
    },
    select: {
      farcasterId: true,
      id: true
    }
  });
}
query();
