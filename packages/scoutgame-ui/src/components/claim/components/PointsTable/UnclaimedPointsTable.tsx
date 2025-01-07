import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPointsReceiptsRewards } from '@packages/scoutgame/points/getPointsReceiptsRewards';

import { PointsTable } from './PointsTable';

export async function UnclaimedPointsTable() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const [, pointsReceiptRewards = []] = await safeAwaitSSRData(
    getPointsReceiptsRewards({
      userId: scoutId,
      isClaimed: false
    })
  );

  return (
    <PointsTable
      emptyMessage='Nice, you have claimed all of your rewards to date!'
      pointsReceiptRewards={pointsReceiptRewards}
      title='Unclaimed'
    />
  );
}
