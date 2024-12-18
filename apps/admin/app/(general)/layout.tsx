import { Box } from '@mui/material';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import type { ReactNode } from 'react';

import { Header } from 'components/common/Header';
import { StickyFooter } from 'components/common/StickyFooter';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();

  return (
    <Box display='grid' gridTemplateRows='auto 1fr auto' minHeight='100vh' bgcolor='background.default'>
      <Header user={user!} />
      <Box component='main' minHeight='100%'>
        {children}
      </Box>
      <StickyFooter isAuthenticated={!!user} />
    </Box>
  );
}
