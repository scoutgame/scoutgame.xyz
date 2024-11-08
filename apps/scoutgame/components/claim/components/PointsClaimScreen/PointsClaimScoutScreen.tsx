'use client';

import { Avatar, Dialog, Stack, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import Image from 'next/image';

export function PointsClaimScoutScreen({
  showModal,
  handleCloseModal,
  claimedPoints,
  displayName,
  topBuilders
}: {
  displayName: string;
  showModal: boolean;
  handleCloseModal: VoidFunction;
  claimedPoints: number;
  topBuilders: { avatar: string; displayName: string }[];
}) {
  const currentWeek = getCurrentSeasonWeekNumber();
  return (
    <Dialog open={showModal} onClose={handleCloseModal} data-test='claim-points-success-modal'>
      <Stack position='relative' width={600} height={600}>
        <Image
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
          width={600}
          height={600}
          src='/images/claim-share-background.png'
          alt='Claim success modal'
        />
        <Stack
          sx={{
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '75%',
            height: '75%',
            alignItems: 'center',
            zIndex: 1,
            mt: 4
          }}
        >
          <Typography variant='h4' fontFamily='K2D'>
            TOP SCOUT
          </Typography>
          <Typography variant='h6' color='secondary' fontWeight={600} mt={2}>
            {displayName}
          </Typography>
          <Typography variant='h6' textAlign='center'>
            scored {claimedPoints} Scout Points <br /> in week {currentWeek} of
          </Typography>
          <Typography fontWeight='bold' variant='h6' textAlign='center' fontFamily='Posterama'>
            SCOUT GAME!
          </Typography>
          <Stack flexDirection='row' gap={1} justifyContent='space-between' width='100%' mt={2} pl={4}>
            <Stack mt={4} gap={1}>
              <Typography variant='h6' fontWeight={700}>
                My Top Builders:
              </Typography>
              {topBuilders.map((builder) => (
                <Stack key={builder.displayName} flexDirection='row' alignItems='center' gap={1}>
                  <Avatar
                    src={builder.avatar}
                    alt={builder.displayName}
                    variant='circular'
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography fontWeight={600}>{builder.displayName}</Typography>
                </Stack>
              ))}
            </Stack>
            <Image src='/images/profile/builder-dog.png' alt='Builder Dog' width={200} height={200} />
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  );
}
