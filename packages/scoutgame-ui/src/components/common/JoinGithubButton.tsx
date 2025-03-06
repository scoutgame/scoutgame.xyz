'use client';

import { Box, Button, Typography } from '@mui/material';
import { usePathname, useSearchParams } from 'next/navigation';

export function JoinGithubButton({ text = 'Connect & Sign up' }: { text?: string }) {
  const params = useSearchParams();
  const connectError = params.get('connect_error');
  const pathname = usePathname();
  const isProfilePage = pathname.includes('profile');
  const href = '/api/connect-github/get-link';

  return (
    <>
      <Button
        href={isProfilePage ? `${href}?profile-redirect=true` : href}
        variant='contained'
        color='primary'
        size='large'
      >
        {text}
      </Button>
      {connectError && (
        <Box>
          <Typography color='error'>{connectError}</Typography>
        </Box>
      )}
    </>
  );
}
