import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

async function query() {
  const scout = await prisma.scout.findFirst({ where: { path: 'mattcasey' } });
  prettyPrint(scout);
}

query();
