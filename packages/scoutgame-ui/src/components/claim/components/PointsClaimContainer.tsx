import { getPlatform } from '@packages/mixpanel/utils';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import type { UnclaimedTokensSource } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/points/getClaimableTokensWithSources';
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

  const platform = getPlatform();

  const isOnchainApp = platform === 'onchain_webapp';

  const [err, data] = await safeAwaitSSRData(
    (isOnchainApp ? getClaimableTokensWithSources : getClaimablePointsWithSources)(scoutId)
  );

  if (err) {
    return null;
  }

  const { bonusPartners, points, builders, repos } = data;

  const claimData = isOnchainApp ? (data as UnclaimedTokensSource).claimData : undefined;

  return (
    <>
      <PointsClaimScreen
        totalUnclaimedPoints={points}
        bonusPartners={bonusPartners}
        builders={builders}
        repos={repos}
        onchainClaimData={claimData}
      />
      {points === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedPointsTable />
        </Suspense>
      )}
    </>
  );
}
