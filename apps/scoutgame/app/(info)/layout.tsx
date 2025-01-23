import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Box
      component='main'
      bgcolor='background.default'
      p={{ md: 3 }}
      height='100%'
      minHeight='100dvh'
      sx={{
        backgroundImage: {
          xs: 'url(/images/mobile_login_background.png)',
          md: 'url(/images/desktop_login_background.png)'
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Box maxWidth='700px' margin='auto' height='100%'>
        {children}
      </Box>
    </Box>
  );
}
