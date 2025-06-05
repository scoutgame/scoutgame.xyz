import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { FarcasterLogin } from './components/FarcasterLogin/FarcasterLogin';
import { SinglePageLayout } from './components/SinglePageLayout';

export function LoginPage() {
  return (
    <SinglePageLayout position='relative' zIndex={2} data-test='login-page'>
      <Image
        src='/images/scout-game-logo-square.png'
        width={300}
        height={150}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '300px',
          height: 'auto'
        }}
        alt='ScoutGame'
      />
      <Typography variant='h5'>Admin Access</Typography>
      <Box display='flex' flexDirection='column' width='100%'>
        <FarcasterLogin />
      </Box>
    </SinglePageLayout>
  );
}
