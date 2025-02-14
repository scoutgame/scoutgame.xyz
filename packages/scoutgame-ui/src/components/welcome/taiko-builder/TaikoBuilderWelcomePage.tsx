import 'server-only';

import { Box, Button, Link, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { JoinGithubButton } from '../../common/JoinGithubButton';
import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

export function TaikoBuilderWelcomePage() {
  return (
    <SinglePageLayout data-test='welcome-builders-page'>
      <SinglePageWrapper bgcolor='background.default' height='auto'>
        <Box display='flex' flexDirection='column' alignItems='center' my={0} justifyContent='space-evenly' gap={2}>
          <Typography variant='h5' fontWeight='700' color='text.secondary'>
            Be a Scout Game Developer
          </Typography>
          <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
          <Typography>Connect your GitHub to be a Developer in Scout Game and register your project.</Typography>
          <Stack width='100%' gap={2} flexDirection='row' justifyContent='flex-end' alignItems='center'>
            <Link href='/scout'>
              <Button variant='outlined' color='primary'>
                Skip
              </Button>
            </Link>
            <Box>
              <Suspense>
                <JoinGithubButton text='Connect' />
              </Suspense>
            </Box>
          </Stack>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
