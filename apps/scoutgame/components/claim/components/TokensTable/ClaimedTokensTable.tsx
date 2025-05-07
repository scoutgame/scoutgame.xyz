import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack } from '@mui/material';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { getTokensReceiptsRewards } from '@packages/scoutgame/tokens/getTokensReceiptsRewards';

import { TokensTable } from './TokensTable';

export async function ClaimedTokensTable() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const [error, data] = await safeAwaitSSRData(
    Promise.all([
      getTokensReceiptsRewards({
        userId: user.id,
        isClaimed: true
      }),
      getPartnerRewards({
        userId: user.id,
        isClaimed: true,
        season: getCurrentSeasonStart()
      })
    ])
  );

  if (error) {
    return null;
  }

  const [tokensReceiptRewards, partnerRewards] = data;

  return (
    <TokensTable
      emptyMessage='History yet to be made.'
      tokensReceiptRewards={tokensReceiptRewards}
      partnerRewards={partnerRewards}
      title={
        <Stack direction='row' alignItems='center' gap={0.5}>
          <CheckCircleIcon />
          Claimed
        </Stack>
      }
      processingPayouts={false}
    />
  );
}
