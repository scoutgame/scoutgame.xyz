import { Stack, Container, Typography } from '@mui/material';
import React from 'react';

import { PartnerCardContainer } from './components/PartnerCardContainer';

export function PartnersDashboard() {
  return (
    <Container maxWidth='md'>
      <Stack spacing={3} justifyContent='center' mb={3}>
        <PartnerCardContainer partner='celo' partnerName='Celo' hasGithubRepos />
        <PartnerCardContainer partner='game7' partnerName='Game7' hasGithubRepos />
        <PartnerCardContainer partner='gooddollar' partnerName='Good Dollar' hasGithubRepos />
        <PartnerCardContainer
          partner='octant'
          partnerName='Octant'
          airdropPartner='octant_base_contribution'
          airdropWalletAddress={process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_ADDRESS}
          hasGithubRepos
        />
        <PartnerCardContainer
          partner='optimism'
          partnerName='Optimism (Top New Scouts)'
          airdropPartner='optimism_new_scout'
          airdropWalletAddress={process.env.NEW_SCOUT_REWARD_ADMIN_ADDRESS}
        />
        <PartnerCardContainer
          partner='referrals'
          partnerName='Referral Rewards'
          airdropPartner='optimism_referral_champion'
          airdropWalletAddress={process.env.REFERRAL_CHAMPION_REWARD_ADMIN_ADDRESS}
        />
        <PartnerCardContainer partner='talent' partnerName='Talent Protocol' />

        <Typography variant='h4' align='center'>
          Completed
        </Typography>

        <PartnerCardContainer partner='op_supersim' partnerName='OP Supersim' hasGithubRepos />
        <PartnerCardContainer partner='moxie' partnerName='Moxie' />
      </Stack>
    </Container>
  );
}
