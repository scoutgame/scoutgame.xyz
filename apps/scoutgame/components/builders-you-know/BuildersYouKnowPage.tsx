import { Box, Button, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { LoadingGallery } from '@packages/scoutgame-ui/components/common/Loading/LoadingGallery';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import { BuildersGalleryContainer } from '@packages/scoutgame-ui/components/scout/components/BuildersGalleryContainer';
import Link from 'next/link';
import { Suspense } from 'react';

export function BuildersYouKnowPage({
  builders,
  dailyAverageGems
}: {
  dailyAverageGems: number;
  builders: BuilderInfo[];
}) {
  return (
    <PageContainer>
      <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
        Builders You Know
      </Typography>
      <Typography mb={2} textAlign='center'>
        We found some Builders you might know
      </Typography>
      <Box display='flex' flexDirection='column' mb={4}>
        <Button variant='contained' LinkComponent={Link} href='/scout' sx={{ margin: 'auto', px: 2 }}>
          See all builders
        </Button>
      </Box>
      <Suspense fallback={<LoadingGallery />}>
        <BuildersGalleryContainer
          dailyAverageGems={dailyAverageGems}
          initialCursor={null}
          initialBuilders={builders}
          showHotIcon={false}
        />
      </Suspense>
    </PageContainer>
  );
}
