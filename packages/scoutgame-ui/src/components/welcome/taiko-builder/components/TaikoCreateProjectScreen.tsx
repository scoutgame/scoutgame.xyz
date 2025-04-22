import { Box, Button, Link, Stack, Typography } from '@mui/material';

import { SinglePageLayout } from '../../../common/Layout';
import { SinglePageWrapper } from '../../../common/SinglePageWrapper';

export function TaikoCreateProjectScreen() {
  return (
    <SinglePageLayout data-test='taiko-developers-create-project-page'>
      <SinglePageWrapper bgcolor='background.default' height='auto'>
        <Box display='flex' flexDirection='column' my={0} justifyContent='space-evenly' gap={2}>
          <Typography variant='h5' alignSelf='center' fontWeight='700' color='text.secondary'>
            Register your Project
          </Typography>
          <Typography>Create a project in Scout Game for your Taiko AI Agent.</Typography>
          <Typography>
            Required:
            <li style={{ listStylePosition: 'outside' }}>Project name</li>
            <li style={{ listStylePosition: 'outside' }}>GitHub repository</li>
            <li style={{ listStylePosition: 'outside' }}>Agent address on Taiko</li>
          </Typography>
          <Typography>
            You will be asked to sign with the deployer to prove ownership. Once we verify your project’s onchain
            activity, you’re in the game!
          </Typography>
          <Stack width='100%' gap={2} flexDirection='row' justifyContent='flex-end' alignItems='center'>
            <Link href='/developers'>
              <Button variant='outlined' color='primary'>
                Skip
              </Button>
            </Link>
            <Link href='/profile/projects/create' data-test='taiko-developers-create-project-button'>
              <Button color='primary'>Create</Button>
            </Link>
          </Stack>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
