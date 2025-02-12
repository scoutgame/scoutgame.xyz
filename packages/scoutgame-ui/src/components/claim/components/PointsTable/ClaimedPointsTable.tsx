import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack } from '@mui/material';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPartnerRewards } from '@packages/scoutgame/points/getPartnerRewards';
import { getPointsReceiptsRewards } from '@packages/scoutgame/points/getPointsReceiptsRewards';

import { PointsTable } from './PointsTable';

export async function ClaimedPointsTable() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const [error, data] = await safeAwaitSSRData(
    Promise.all([
      getPointsReceiptsRewards({
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

  const [pointsReceiptRewards, partnerRewards] = data;

  return (
    <PointsTable
      emptyMessage='History yet to be made.'
      pointsReceiptRewards={pointsReceiptRewards}
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
