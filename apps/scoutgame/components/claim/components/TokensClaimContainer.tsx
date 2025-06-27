import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUnclaimedPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { getScoutPartnersInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';
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
    Promise.all([
      getClaimableTokensWithSources(scoutId),
      getUnclaimedPartnerRewards({ userId: scoutId }),
      getScoutPartnersInfo()
    ])
  );

  if (err) {
    return null;
  }

  const [claimableTokens, unclaimedPartnerRewards, scoutPartners] = data;
  const { tokens, developers, repos, processingPayouts } = claimableTokens;

  const claims = (claimableTokens as UnclaimedTokensSource).claims;

  return (
    <>
      <TokensClaimScreen
        developers={developers}
        totalUnclaimedTokens={tokens}
        repos={repos}
        onchainClaims={claims}
        partnerRewards={unclaimedPartnerRewards}
        processingPayouts={processingPayouts}
        scoutPartners={scoutPartners}
      />
      {tokens === 0 && unclaimedPartnerRewards.length === 0 ? null : (
        <Suspense fallback={<LoadingTable />}>
          <UnclaimedTokensTable />
        </Suspense>
      )}
    </>
  );
}
