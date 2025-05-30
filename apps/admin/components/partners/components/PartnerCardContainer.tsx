import type { BonusPartner } from '@packages/scoutgame/partnerRewards/constants';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import React, { Suspense } from 'react';

import { AirdropMetrics } from './AirdropMetrics';
import { GithubMetrics } from './GithubMetrics';
import { PartnerCard } from './PartnerCard';

export function PartnerCardContainer({
  partner,
  partnerName,
  airdropPartner,
  airdropWalletAddress,
  hasGithubRepos = false
}: {
  partner: string;
  partnerName: string;
  airdropPartner?: string;
  airdropWalletAddress?: string;
  hasGithubRepos?: boolean;
}) {
  return (
    <PartnerCard partner={partner} partnerName={partnerName} hasGithubRepos={hasGithubRepos}>
      {(hasGithubRepos || airdropPartner) && (
        <Suspense fallback={<LoadingComponent isLoading />}>
          {airdropPartner && <AirdropMetrics partner={airdropPartner} walletAddress={airdropWalletAddress} />}
          {hasGithubRepos && <GithubMetrics partner={partner as BonusPartner} />}
        </Suspense>
      )}
    </PartnerCard>
  );
}
