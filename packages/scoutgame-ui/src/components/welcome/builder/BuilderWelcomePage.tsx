import 'server-only';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { JoinGithubButton } from '../../common/JoinGithubButton';
import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

import { SkipBuilderStepButton } from './components/SkipBuilderStepButton';

export function BuilderPage() {
  return (
    <SinglePageLayout data-test='welcome-builders-page'>
      <SinglePageWrapper bgcolor='background.default' height='auto'>
        <Box display='flex' flexDirection='column' alignItems='center' my={0} justifyContent='space-evenly' gap={2}>
          <Image
            src='/images/scout-game-logo.png'
            width={400}
            height={200}
            sizes='100vw'
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto'
            }}
            alt='Scout game score'
          />
          <Typography variant='h5' fontWeight='700' color='text.secondary'>
            Are you a developer?
          </Typography>
          <Typography>
            Scout Game rewards Developers for contributing to the onchain ecosystem. You earn more rewards when scouts
            show their support by minting your unique NFT.
          </Typography>
          <Typography>
            Sign up as a Developer now, and you will be eligible to earn DEV Tokens and a share of your NFT sales during
            the first season of Scout Game.
          </Typography>
          <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
          <Typography>Connect to GitHub to sign up and verify your code contributions.</Typography>
          <Box width='100%'>
            <Box display='flex' flexDirection='column' gap={2}>
              <Suspense>
                <JoinGithubButton />
              </Suspense>
              <SkipBuilderStepButton />
            </Box>
          </Box>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
