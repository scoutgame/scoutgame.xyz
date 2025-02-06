import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getPlatform } from '@packages/mixpanel/platform';
import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import type { UnclaimedTokensSource } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/points/getPartnerRewards';
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
    Promise.all([
      (isOnchainApp ? getClaimableTokensWithSources : getClaimablePointsWithSources)(scoutId),
      prisma.partnerRewardPayout.count({
        where: {
          payoutContract: {
            season: getCurrentSeasonStart()
          },
          claimedAt: null,
          userId: scoutId
        }
      }),
      getUnclaimedPartnerRewards({ userId: scoutId })
    ])
  );

  if (err) {
    return null;
  }

  const [claimablePoints, partnerRewardPayoutCount, unclaimedPartnerRewards] = data;
  const { bonusPartners, points, builders, repos, processingPayouts } = claimablePoints;

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
      {points === 0 && partnerRewardPayoutCount === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedPointsTable />
        </Suspense>
      )}
    </>
  );
}
