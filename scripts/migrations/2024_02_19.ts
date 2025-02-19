import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());

async function query() {
  console.log(
    await prisma.githubRepo.updateMany({
      where: { owner: 'gitcoinco', bonusPartner: 'octant' },
      data: {
        bonusPartner: null
      }
    })
  );
  console.log(
    await prisma.githubRepo.updateMany({
      where: { owner: 'AbundanceProtocol', bonusPartner: 'octant' },
      data: {
        bonusPartner: null
      }
    })
  );
  console.log(
    await prisma.githubRepo.updateMany({
      where: { owner: 'opensource-observer', bonusPartner: 'octant' },
      data: {
        bonusPartner: null
      }
    })
  );
}

query();
