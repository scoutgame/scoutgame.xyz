import { Stack } from '@mui/material';
import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  imageSrc: string;
  imageAlt: string;
  isDesktop: boolean;
}

export function PageLayout({ children, imageSrc, imageAlt, isDesktop }: PageLayoutProps) {
  return (
    <Stack
      flexDirection={{
        xs: 'column-reverse',
        md: 'row'
      }}
      justifyContent='space-between'
      alignItems='center'
      px={{
        xs: 2,
        md: 8
      }}
      mb={{
        xs: 2,
        md: 4
      }}
    >
      {children}
      <img
        src={imageSrc}
        alt={imageAlt}
        width={isDesktop ? 350 : 300}
        height={isDesktop ? 350 : 300}
        style={{ borderRadius: '10px' }}
      />
    </Stack>
  );
}
