import { log } from '@charmverse/core/log';
import { Clear as ClearIcon } from '@mui/icons-material';
import { Stack, Card, Grid2 as Grid, Container, Skeleton } from '@mui/material';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import React, { Suspense } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

import { CeloMetrics } from './components/CeloMetrics';
import { Game7Metrics } from './components/Game7Metrics';
import { MoxieMetrics } from './components/MoxieMetrics';
import { PartnerCard } from './components/PartnerCard';

export function PartnersDashboard() {
  return (
    <Container maxWidth='lg'>
      <Stack spacing={3} justifyContent='center'>
        <PartnerCard partner='celo' partnerName='Celo'>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <CeloMetrics />
          </Suspense>
        </PartnerCard>
        <PartnerCard partner='game7' partnerName='Game7'>
          {/* <Game7Metrics /> */}
        </PartnerCard>
        <PartnerCard partner='octant' partnerName='Octant'>
          {/* <OctantMetrics /> */}
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
