import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getStartOfMatchup } from '@packages/matchup/getMatchupDetails';
import { getRelativeTime } from '@packages/utils/dates';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';

import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { Address } from 'viem';

async function query() {
  await prisma.blockchainLog.deleteMany({
    // where: {
    //   contractId: 1
    // }
  });
  const logs = await getTransferSingleWithBatchMerged({
    chainId: 8453,
    contractAddress: '0x77ef845f8b2b7b40b68af10d1031313983ccf5a2' as Address,
    fromBlock: 29_504_000
  });
  console.log(logs.slice(0, 3));
}
query();
