import Box from '@mui/material/Box';
import { getInitColorSchemeScript } from '@mui/material/styles';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './cssVariables.scss';
import { NavBar } from '../components/Header/Navbar/NavBar';
import { AppProviders } from '../components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'Connect App',
  description: 'Generated by create next app'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        {getInitColorSchemeScript()}
        <AppProviders>
          <NavBar />
          <Box component='main'>{children}</Box>
        </AppProviders>
      </body>
    </html>
  );
}
