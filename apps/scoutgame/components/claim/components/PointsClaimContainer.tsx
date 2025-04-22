import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { UnclaimedTokensSource } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/points/getPartnerRewards';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { Suspense } from 'react';

import { PointsClaimScreen } from './PointsClaimScreen/PointsClaimScreen';
import { UnclaimedPointsTable } from './PointsTable/UnclaimedPointsTable';

export async function PointsClaimContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const [err, data] = await safeAwaitSSRData(
    Promise.all([getClaimableTokensWithSources(scoutId), getUnclaimedPartnerRewards({ userId: scoutId })])
  );

  if (err) {
    return null;
  }

  const [claimablePoints, unclaimedPartnerRewards] = data;
  const { bonusPartners, points, builders, repos, processingPayouts } = claimablePoints;

  const claimData = (claimablePoints as UnclaimedTokensSource).claimData;

  return (
    <>
      <PointsClaimScreen
        totalUnclaimedPoints={points}
        bonusPartners={bonusPartners}
        builders={builders}
        repos={repos}
        onchainClaimData={claimData}
        partnerRewards={unclaimedPartnerRewards}
        processingPayouts={processingPayouts}
      />
      {points === 0 && unclaimedPartnerRewards.length === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedPointsTable />
        </Suspense>
      )}
    </>
  );
}
