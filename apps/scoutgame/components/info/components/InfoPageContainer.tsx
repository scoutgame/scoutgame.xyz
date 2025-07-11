import type { StackProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';
import { getScoutPartnersInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';
import Image from 'next/image';

import { SidebarInfoDrawer } from './SidebarInfoDrawer';

export async function InfoPageContainer({
  children,
  title,
  image,
  ...props
}: { title?: string; image?: string } & StackProps) {
  const scoutPartnersInfo = await getScoutPartnersInfo({ status: 'active' });

  return (
    <Stack maxWidth='854px' width='100%' mx='auto' gap={{ xs: 2, md: 4 }}>
      {image && (
        <Image
          src={image}
          width={854}
          height={285}
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
          priority={true}
          placeholder='blur'
          blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII='
          alt='info banner'
        />
      )}
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent={{ xs: 'space-between', md: 'center' }}
        data-test='info-page'
        {...props}
      >
        {title && (
          <Typography variant='h4' textAlign='center' color='secondary'>
            {title}
          </Typography>
        )}
        <SidebarInfoDrawer partners={scoutPartnersInfo} />
      </Stack>
      {children}
    </Stack>
  );
}
