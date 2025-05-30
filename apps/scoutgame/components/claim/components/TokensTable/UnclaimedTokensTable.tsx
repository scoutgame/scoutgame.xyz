import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { checkIsProcessingPayouts } from '@packages/scoutgame/tokens/checkIsProcessingPayouts';
import { getTokensReceiptsRewards } from '@packages/scoutgame/tokens/getTokensReceiptsRewards';

import { TokensTable } from './TokensTable';

export async function UnclaimedTokensTable() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const [err, data] = await safeAwaitSSRData(
    Promise.all([
      getTokensReceiptsRewards({
        userId: scoutId,
        isClaimed: false
      }),
      getPartnerRewards({
        userId: scoutId,
        isClaimed: false,
        season: getCurrentSeasonStart()
      }),
      checkIsProcessingPayouts({ week: getLastWeek() })
    ])
  );

  if (err) {
    return null;
  }

  const [tokensReceiptRewards, partnerRewards, processingPayouts = false] = data;

  return (
    <TokensTable
      emptyMessage='Nice, you have claimed all of your rewards to date!'
      tokensReceiptRewards={tokensReceiptRewards}
      partnerRewards={partnerRewards}
      title='Unclaimed'
      processingPayouts={processingPayouts}
    />
  );
}
