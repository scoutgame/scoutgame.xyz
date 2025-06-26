'use client';

import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Stack, Paper, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { BackButton } from '@packages/scoutgame-ui/components/common/Button/BackButton';
import { UserProfile } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { DevelopersGallery } from 'components/common/Gallery/DevelopersGallery';

import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export type ScoutProfileProps = {
  scout: BasicUserInfo & {
    builderStatus?: BuilderStatus | null;
  };
  allTimeTokens: number;
  seasonTokens: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
};

export function PublicScoutProfileContainer({
  scout,
  allTimeTokens,
  seasonTokens,
  nftsPurchased,
  scoutedBuilders
}: ScoutProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      {!isDesktop ? (
        <Paper sx={{ py: 2, mb: { xs: 1, md: 2 } }}>
          <Stack flexDirection='row'>
            <BackButton />
            <Box width='calc(100% - 50px)'>
              <UserProfile user={scout} avatarSize={isDesktop ? 'xLarge' : 'large'} />
            </Box>
          </Stack>
        </Paper>
      ) : null}
      <Paper
        sx={{
          my: 2,
          p: {
            xs: 0,
            md: 2
          },
          backgroundColor: {
            xs: 'transparent',
            md: 'background.dark'
          }
        }}
        elevation={0}
      >
        <PublicScoutProfileStats
          allTimeTokens={allTimeTokens}
          seasonTokens={seasonTokens}
          buildersScouted={scoutedBuilders.length}
          nftsPurchased={nftsPurchased}
        />
        <Typography variant='h6' my={2} color='secondary' fontWeight='500' textAlign='center'>
          Scouted Developers
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <DevelopersGallery
            scoutInView={scout.id}
            builders={scoutedBuilders}
            columns={5}
            size={isDesktop ? 'large' : 'small'}
          />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>This Scout hasn't discovered any Developers yet. Check back to see who they find!</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
