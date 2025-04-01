import { Box, Button, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { LoadingGallery } from '@packages/scoutgame-ui/components/common/Loading/LoadingGallery';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import Link from 'next/link';
import { Suspense } from 'react';

import { BuildersGalleryContainer } from 'components/scout/components/BuildersGalleryContainer';

export function BuildersYouKnowPage({ builders }: { builders: BuilderInfo[] }) {
  return (
    <PageContainer>
      <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
        Developers You Know
      </Typography>
      <Typography mb={2} textAlign='center'>
        We found some Developers you might know
      </Typography>
      <Box display='flex' flexDirection='column' mb={4}>
        <Button variant='contained' LinkComponent={Link} href='/scout' sx={{ margin: 'auto', px: 2 }}>
          See all developers
        </Button>
      </Box>
      <Suspense fallback={<LoadingGallery />}>
        <BuildersGalleryContainer nftType='default' initialCursor={null} initialBuilders={builders} />
      </Suspense>
    </PageContainer>
  );
}
