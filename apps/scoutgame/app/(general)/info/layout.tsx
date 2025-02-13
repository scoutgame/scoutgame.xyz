import { Container, Stack } from '@mui/material';
import { InfoPageFooter } from '@packages/scoutgame-ui/components/info/components/InfoPageFooter';
import { SidebarInfo } from '@packages/scoutgame-ui/components/info/components/SidebarInfo';
import type { ReactNode } from 'react';

export default async function Layout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <Container maxWidth='lg'>
        <Stack py={8} gap={8} maxWidth='100%' flexDirection='row'>
          <Stack sx={{ display: { xs: 'none', md: 'flex' }, minWidth: { md: '235px' } }}>
            <SidebarInfo />
          </Stack>
          {children}
        </Stack>
      </Container>
      <InfoPageFooter />
    </>
  );
}
