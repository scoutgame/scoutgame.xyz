import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPartnerRewards } from '@packages/scoutgame/points/getPartnerRewards';
import { getPointsReceiptsRewards } from '@packages/scoutgame/points/getPointsReceiptsRewards';

import { PointsTable } from './PointsTable';

export async function UnclaimedPointsTable() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const [err, data] = await safeAwaitSSRData(
    Promise.all([
      getPointsReceiptsRewards({
        userId: scoutId,
        isClaimed: false
      }),
      getPartnerRewards({
        userId: scoutId,
        isClaimed: false,
        season: getCurrentSeasonStart()
      })
    ])
  );

  if (err) {
    return null;
  }

  const [pointsReceiptRewards, partnerRewards] = data;

  return (
    <PointsTable
      emptyMessage='Nice, you have claimed all of your rewards to date!'
      pointsReceiptRewards={pointsReceiptRewards}
      partnerRewards={partnerRewards}
      title='Unclaimed'
    />
  );
}
