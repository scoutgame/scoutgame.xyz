import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import { Stack, Card, Grid2 as Grid, Container, Skeleton } from '@mui/material';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import React, { Suspense } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

import { GithubMetrics } from './components/GithubMetrics';
import { MoxieMetrics } from './components/MoxieMetrics';
import { PartnerCard } from './components/PartnerCard';

export function PartnersDashboard() {
  return (
    <Container maxWidth='lg'>
      <Stack spacing={3} justifyContent='center'>
        <PartnerCard partner='celo' partnerName='Celo'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <GithubMetrics partner='celo' />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='game7' partnerName='Game7'>
          <GithubMetrics partner='game7' />
        </PartnerCard>
        <PartnerCard partner='octant' partnerName='Octant'>
          <GithubMetrics partner='octant' />
        </PartnerCard>
        <PartnerCard partner='optimism' partnerName='Optimism'>
          {/* <OptimismMetrics /> */}
        </PartnerCard>
        <PartnerCard partner='op_supersim' partnerName='OP Supersim'>
          {/* <SupersimMetrics /> */}
        </PartnerCard>
        <PartnerCard partner='referrals' partnerName='Referral Rewards'>
          {/* <ReferralMetrics /> */}
        </PartnerCard>
        <PartnerCard partner='talent' partnerName='Talent Protocol'>
          {/* <TalentMetrics /> */}
        </PartnerCard>
        <PartnerCard partner='moxie' partnerName='Moxie'>
          {/* <MoxieMetrics /> */}
        </PartnerCard>
      </Stack>
    </Container>
  );
}
