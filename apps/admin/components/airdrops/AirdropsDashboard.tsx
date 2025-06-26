import { Container, Stack, Typography } from '@mui/material';
import { BASE_USDC_ADDRESS, GOODDOLLAR_TOKEN_ADDRESS, optimismTokenAddress } from '@packages/blockchain/constants';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import { base, celo, optimism } from 'viem/chains';

import { PartnerCardContainer } from './components/PartnerCardContainer';

export function AirdropsDashboard() {
  return (
    <Container maxWidth='md'>
      <Stack spacing={3} justifyContent='center' mb={3}>
        <PartnerCardContainer partner='celo' partnerName='Celo' hasGithubRepos />
        <PartnerCardContainer
          partner='gooddollar'
          partnerName='GoodDollar'
          hasGithubRepos
          airdropPartner='gooddollar_contribution'
          airdropWalletAddress={process.env.REACT_APP_REWARDS_WALLET_ADDRESS}
          chainId={celo.id}
          tokenAddress={GOODDOLLAR_TOKEN_ADDRESS}
          tokenSymbol='G$'
          tokenDecimals={18}
        />
        <PartnerCardContainer
          partner='referrals'
          partnerName='Referral Rewards'
          airdropPartner='optimism_referral_champion'
          airdropWalletAddress={process.env.REACT_APP_REWARDS_WALLET_ADDRESS}
          chainId={optimism.id}
          tokenAddress={optimismTokenAddress}
          tokenSymbol='OP'
          tokenDecimals={18}
        />
        <PartnerCardContainer partner='talent' partnerName='Talent Protocol' />
        <PartnerCardContainer
          partner='matchup'
          partnerName='Matchup OP Rewards'
          airdropPartner='matchup_rewards'
          airdropWalletAddress={process.env.REACT_APP_REWARDS_WALLET_ADDRESS}
          chainId={optimism.id}
          tokenAddress={optimismTokenAddress}
          tokenSymbol='OP'
          tokenDecimals={18}
        />
        <PartnerCardContainer
          partner='matchup_pool'
          partnerName='Matchup Pool Rewards'
          airdropPartner='matchup_pool_rewards'
          airdropWalletAddress={process.env.REACT_APP_REWARDS_WALLET_ADDRESS}
          chainId={base.id}
          tokenAddress={devTokenContractAddress}
          tokenSymbol='DEV'
          tokenDecimals={18}
        />

        <Typography variant='h4' align='center'>
          Completed
        </Typography>

        <PartnerCardContainer
          partner='octant'
          partnerName='Octant'
          airdropPartner='octant_base_contribution'
          airdropWalletAddress={process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_ADDRESS}
          hasGithubRepos
          chainId={base.id}
          tokenAddress={BASE_USDC_ADDRESS}
          tokenSymbol='USDC'
          tokenDecimals={6}
        />
        <PartnerCardContainer partner='game7' partnerName='Game7' hasGithubRepos />
        <PartnerCardContainer partner='op_supersim' partnerName='OP Supersim' hasGithubRepos />
        <PartnerCardContainer partner='moxie' partnerName='Moxie' />
      </Stack>
    </Container>
  );
}
