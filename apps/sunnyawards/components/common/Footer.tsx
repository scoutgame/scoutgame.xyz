'use client';

import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { Box, Link, Typography } from '@mui/material';
import Image from 'next/image';

export function Footer() {
  const trackEvent = useTrackEvent();
  return (
    <Box
      width='100%'
      component='footer'
      textAlign='center'
      bgcolor='footerBackground.main'
      mx='auto'
      p={1}
      display='flex'
      alignItems='center'
      justifyContent='center'
      gap={0.5}
    >
      <Typography component='span'>Powered by</Typography>
      <Link
        href='https://charmverse.io'
        target='_blank'
        rel='noopener'
        onMouseDown={() => {
          trackEvent('click_powered_by_charmverse');
        }}
      >
        <Image
          src='/images/charmverse-logo-white.webp'
          width={100}
          height={20}
          alt='CharmVerse'
          style={{ verticalAlign: 'middle' }}
        />
      </Link>
    </Box>
  );
}
