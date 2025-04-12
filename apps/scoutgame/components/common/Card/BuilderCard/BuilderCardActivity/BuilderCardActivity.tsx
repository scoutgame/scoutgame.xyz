'use client';

import InfoIcon from '@mui/icons-material/Info';
import type { Theme } from '@mui/material';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import Image from 'next/image';
import { useState } from 'react';

import { BuilderCardActivityTooltip } from './BuilderCardActivityTooltip';
import { BuilderCardRankGraph } from './BuilderCardRankGraph';

export function BuilderCardActivity({
  size,
  last14DaysRank,
  estimatedPayout,
  gemsCollected
}: {
  gemsCollected: number;
  size: 'x-small' | 'small' | 'medium' | 'large';
  last14DaysRank: (number | null)[];
  estimatedPayout: number;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const mdFontSize = size === 'medium' || size === 'large' ? '8.5px' : '5px';

  return (
    <>
      <Stack
        flexDirection='row'
        px={0.5}
        pt={{
          xs: 0,
          md: 0.25
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsDialogOpen(true);
        }}
      >
        <Stack width='fit-content'>
          <Stack pr={0.5}>
            <Typography
              fontSize={{
                xs: 7,
                md: mdFontSize
              }}
              textAlign='center'
              fontWeight={500}
              color='secondary'
            >
              WEEK'S GEMS
            </Typography>
            <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
              <Typography
                fontWeight={600}
                fontSize={{
                  xs: 11.5,
                  md: 15
                }}
                color='secondary'
              >
                {gemsCollected}
              </Typography>
              <Image
                width={isMobile ? 12.5 : 15}
                height={isMobile ? 12.5 : 15}
                src='/images/icons/gem.svg'
                alt='scout game icon '
              />
            </Stack>
          </Stack>
          <Box sx={{ backgroundColor: 'primary.main', height: '1px', width: '100%', mb: 0.25 }} />
          <Stack pr={0.5}>
            <Typography
              fontSize={{
                xs: 7,
                md: mdFontSize
              }}
              textAlign='center'
              fontWeight={500}
              color='green.main'
            >
              EST. PAYOUT
            </Typography>
            <Stack flexDirection='row' alignItems='center' gap={0.5} justifyContent='center'>
              <Typography
                fontWeight={600}
                fontSize={{
                  xs: 11.5,
                  md: 15
                }}
                color='green.main'
              >
                {estimatedPayout}
              </Typography>
              <Image width={15} height={15} src='/images/icons/binoculars-green.svg' alt='scout game icon' />
            </Stack>
          </Stack>
        </Stack>
        <Box sx={{ backgroundColor: 'primary.main', height: '100%', width: '1px' }} />
        <Stack
          sx={{
            flex: 1
          }}
        >
          <Typography
            sx={{
              pl: 0.25,
              fontWeight: 500,
              color: 'text.secondary',
              fontSize: {
                xs: '6.5px',
                md: mdFontSize
              },
              textAlign: 'center'
            }}
          >
            RANK
          </Typography>
          <Stack width='calc(100% + 5px)' height='100%'>
            <BuilderCardRankGraph ranks={last14DaysRank} />
          </Stack>
        </Stack>
      </Stack>
      <Dialog
        onClick={(e) => {
          e.stopPropagation();
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <InfoIcon color='secondary' />
            <Typography color='secondary' variant='h5'>
              Developer Data
            </Typography>
          </Stack>
        }
      >
        <BuilderCardActivityTooltip />
      </Dialog>
    </>
  );
}
