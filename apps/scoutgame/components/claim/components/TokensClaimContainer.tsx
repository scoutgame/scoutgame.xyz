import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import type { UnclaimedTokensSource } from '@packages/scoutgame/tokens/getClaimableTokensWithSources';
import { getClaimableTokensWithSources } from '@packages/scoutgame/tokens/getClaimableTokensWithSources';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { Suspense } from 'react';

import { TokensClaimScreen } from './TokensClaimScreen/TokensClaimScreen';
import { UnclaimedTokensTable } from './TokensTable/UnclaimedTokensTable';

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

  const [claimableTokens, unclaimedPartnerRewards] = data;
  const { tokens, developers, repos, processingPayouts } = claimableTokens;

  const claimData = (claimableTokens as UnclaimedTokensSource).claimData;

  return (
    <>
      <TokensClaimScreen
        developers={developers}
        repos={repos}
        onchainClaimData={claimData}
        partnerRewards={unclaimedPartnerRewards}
        processingPayouts={processingPayouts}
      />
      {tokens === 0 && unclaimedPartnerRewards.length === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedTokensTable />
        </Suspense>
      )}
    </>
  );
}
