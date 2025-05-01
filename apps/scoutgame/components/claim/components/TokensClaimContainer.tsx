import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import type { UnclaimedTokensSource } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/points/getClaimableTokensWithSources';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { Suspense } from 'react';

import { UnclaimedTokensTable } from './PointsTable/UnclaimedTokensTable';
import { TokensClaimScreen } from './TokensClaimScreen/TokensClaimScreen';

export async function TokensClaimContainer() {
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
  const { points, developers, repos, processingPayouts } = claimablePoints;

  const claimData = (claimablePoints as UnclaimedTokensSource).claimData;

  return (
    <>
      <TokensClaimScreen
        totalUnclaimedPoints={points}
        developers={developers}
        repos={repos}
        onchainClaimData={claimData}
        partnerRewards={unclaimedPartnerRewards}
        processingPayouts={processingPayouts}
      />
      {points === 0 && unclaimedPartnerRewards.length === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedTokensTable />
        </Suspense>
      )}
    </>
  );
}
