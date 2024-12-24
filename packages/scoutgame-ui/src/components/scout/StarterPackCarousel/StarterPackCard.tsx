'use client';

import { Box, Button, Paper, Stack } from '@mui/material';
import { getBuilderData } from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { useState } from 'react';

import { useLgScreen, useMdScreen } from '../../../hooks/useMediaScreens';
import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Dialog } from '../../common/Dialog';

import { StarterPackCardDetails } from './StarterPackCardDetails';

export function StarterPackCard({ builder }: { builder: StarterPackBuilder }) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const size = isLgScreen ? 'large' : isDesktop ? 'small' : 'small';
  const builderData = getBuilderData({ fid: builder.farcasterId });
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Stack
      key={builder.id}
      flexDirection='row'
      component={Paper}
      gap={2}
      p={{ xs: 1, md: 4 }}
      bgcolor='transparent'
      border='1px solid'
      borderColor='green.main'
      sx={{
        backgroundImage: `url(/images/backgrounds/star-bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Box>
        <BuilderCard
          builder={builder}
          showPurchaseButton
          markStarterCardPurchased={builder.purchased}
          type='starter_pack'
          size={size}
        />
      </Box>
      <Stack component={Paper} p={1} pr={{ xs: 2, md: 1 }} position='relative' justifyContent='center'>
        <StarterPackCardDetails
          name={builderData.name}
          description={builderData.description}
          ecosystem={builderData.ecosystem}
        />
        <Button
          variant='text'
          onClick={() => setIsModalOpen(true)}
          sx={{ display: { xs: 'block', md: 'none' }, width: 'fit-content' }}
        >
          Read more
        </Button>
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} title='Builder info'>
          <StarterPackCardDetails
            name={builderData.name}
            description={builderData.description}
            ecosystem={builderData.ecosystem}
            noTrim
          />
        </Dialog>
      </Stack>
    </Stack>
  );
}
