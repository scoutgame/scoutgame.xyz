import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import { Stack, Card, Grid2 as Grid, Container, Skeleton, Typography } from '@mui/material';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import React, { Suspense } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

import { AirdropMetrics } from './components/AirdropMetrics';
import { GithubMetrics } from './components/GithubMetrics';
import { MoxieMetrics } from './components/MoxieMetrics';
import { PartnerCard } from './components/PartnerCard';

export function PartnersDashboard() {
  return (
    <Container maxWidth='md'>
      <Stack spacing={3} justifyContent='center' mb={3}>
        <PartnerCard partner='celo' partnerName='Celo'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <GithubMetrics partner='celo' />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='game7' partnerName='Game7'>
          <GithubMetrics partner='game7' />
        </PartnerCard>
        <PartnerCard partner='octant' partnerName='Octant'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <AirdropMetrics
              partner='octant_base_contribution'
              walletAddress={process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_ADDRESS}
            />
            <GithubMetrics partner='octant' />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='optimism' partnerName='Optimism (Top New Scouts)'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <AirdropMetrics partner='optimism_new_scout' walletAddress={process.env.NEW_SCOUT_REWARD_ADMIN_ADDRESS} />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='referrals' partnerName='Referral Rewards'>
          {/* <ReferralMetrics /> */}
          <Suspense fallback={<LoadingComponent isLoading />}>
            <AirdropMetrics
              partner='optimism_referral_champion'
              walletAddress={process.env.REFERRAL_CHAMPION_REWARD_ADMIN_ADDRESS}
            />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='talent' partnerName='Talent Protocol'>
          {/* <TalentMetrics /> */}
        </PartnerCard>

        <Typography variant='h4' align='center'>
          Completed
        </Typography>

        <PartnerCard partner='op_supersim' partnerName='OP Supersim'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <GithubMetrics partner='op_supersim' />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='moxie' partnerName='Moxie'>
          {/* <MoxieMetrics /> */}
        </PartnerCard>
      </Stack>
    </Container>
  );
}
