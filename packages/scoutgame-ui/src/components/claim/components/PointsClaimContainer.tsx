import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import { getSession } from '@packages/scoutgame/session/getSession';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import { Suspense } from 'react';

import { LoadingTable } from '../../common/Loading/LoadingTable';

import { PointsClaimScreen } from './PointsClaimScreen/PointsClaimScreen';
import { UnclaimedPointsTable } from './PointsTable/UnclaimedPointsTable';

export async function PointsClaimContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const [err, data] = await safeAwaitSSRData(getClaimablePointsWithSources(scoutId));

  if (err) {
    return null;
  }

  const { bonusPartners, points, builders, repos } = data;

  return (
    <>
      <PointsClaimScreen
        totalUnclaimedPoints={points}
        bonusPartners={bonusPartners}
        builders={builders}
        repos={repos}
      />
      {points === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedPointsTable />
        </Suspense>
      )}
    </>
  );
}
