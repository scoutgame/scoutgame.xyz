import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

async function wipeTestData() {
  if (process.env.NODE_ENV === 'test') {
    // Reset the database before each test
    await prisma.scoutGameActivity.deleteMany({});
    await prisma.builderStrike.deleteMany({});
    await prisma.nFTPurchaseEvent.deleteMany({});
    await prisma.gemsPayoutEvent.deleteMany({});
    await prisma.pointsReceipt.deleteMany({});
    await prisma.builderNft.deleteMany({});
    await prisma.builderEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubRepo.deleteMany({});
    await prisma.githubUser.deleteMany({});
    await prisma.scout.deleteMany({});
    await prisma.scoutProjectWallet.deleteMany({});
    await prisma.scoutProjectContract.deleteMany({});
    await prisma.scoutProject.deleteMany({});
    await prisma.partnerRewardPayoutContract.deleteMany({});
    // eslint-disable-next-line no-console
    log.debug('✅ Database wiped');
  }

  return true;
}
wipeTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    log.error(error);
    process.exit(1);
  });
