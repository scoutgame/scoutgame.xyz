import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { usePageTitle } from 'hooks/usePageTitle';
import { useEffect, useState, useMemo } from 'react';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { BountyWithDetails, PageContent } from 'models';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import { useBounties } from 'hooks/useBounties';
import BountyDescription from 'components/bounties/[bountyId]/components_v3/BountyDescription';

export default function BountyDetails () {

  const router = useRouter();
  const [_, setPageTitle] = usePageTitle();
  const { currentBounty, currentBountyId } = useBounties();

  console.log('Rendering', !!currentBounty);

  if (!currentBounty || currentBounty?.id !== currentBountyId) {
    return null;

    // return null;
  }

  return (
    <Box py={3} px='80px'>

      <Container top={20}>
        <BountyHeader />

        <BountyDescription />

      </Container>
    </Box>
  );

}

