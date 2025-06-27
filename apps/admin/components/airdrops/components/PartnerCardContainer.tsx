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
  hasGithubRepos = false,
  chainId,
  tokenAddress,
  tokenSymbol,
  tokenDecimals
}: {
  partner: string;
  partnerName: string;
  airdropPartner?: string;
  airdropWalletAddress?: string;
  hasGithubRepos?: boolean;
  chainId?: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}) {
  return (
    <PartnerCard partner={partner} partnerName={partnerName} hasGithubRepos={hasGithubRepos}>
      {(hasGithubRepos || airdropPartner) && (
        <Suspense fallback={<LoadingComponent isLoading />}>
          {airdropPartner && chainId && tokenAddress && tokenSymbol && tokenDecimals && (
            <AirdropMetrics
              partner={airdropPartner}
              walletAddress={airdropWalletAddress}
              chainId={chainId}
              tokenAddress={tokenAddress}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
            />
          )}
          {hasGithubRepos && <GithubMetrics partner={partner} />}
        </Suspense>
      )}
    </PartnerCard>
  );
}
