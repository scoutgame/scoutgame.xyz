import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/partnerReward/getPartnerRewardsForScout';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import type { UnclaimedTokensSource } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { isOnchainPlatform } from '@packages/utils/platform';
import { Suspense } from 'react';

import { PointsClaimScreen } from './PointsClaimScreen/PointsClaimScreen';
import { UnclaimedPointsTable } from './PointsTable/UnclaimedPointsTable';

export async function PointsClaimContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const isOnchainApp = isOnchainPlatform();

  const [err, data] = await safeAwaitSSRData(
    Promise.all([
      (isOnchainApp ? getClaimableTokensWithSources : getClaimablePointsWithSources)(scoutId),
      getUnclaimedPartnerRewards({ userId: scoutId })
    ])
  );

  if (err) {
    return null;
  }

  const [claimablePoints, unclaimedPartnerRewards] = data;
  const { points, builders, repos, processingPayouts } = claimablePoints;
  const bonusPartners = unclaimedPartnerRewards.map((reward) => reward.partner);

  const claimData = isOnchainApp ? (claimablePoints as UnclaimedTokensSource).claimData : undefined;

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
