import { IconButton, Stack, Typography } from '@mui/material';
import { type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { DateTime } from 'luxon';
import Image from 'next/image';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { Avatar } from '../Avatar';
import { BuilderCardRankGraph } from '../Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { Dialog } from '../Dialog';

export function DeveloperInfoModal({
  open,
  onClose,
  developer
}: {
  open: boolean;
  onClose: () => void;
  developer: DeveloperInfo;
}) {
  const isDesktop = useMdScreen();

  if (!developer) {
    return null;
  }

  const joinedAt = DateTime.fromISO(developer.joinedAt.toISOString());
  const joinedAtMonth = joinedAt.monthShort;
  const joinedAtYear = joinedAt.year;

  const githubConnectedAt = DateTime.fromISO(developer.githubConnectedAt.toISOString());
  const githubConnectedAtMonth = githubConnectedAt.monthShort;
  const githubConnectedAtYear = githubConnectedAt.year;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 600,
          bgcolor: 'black.main',
          borderRadius: 2
        }
      }}
    >
      <Stack pt={2.5} gap={2}>
        <Stack direction='row' alignItems='center' gap={2}>
          <Stack position='relative'>
            <Avatar src={developer.avatar} name={developer.displayName} size='xLarge' variant='circular' />
            <Stack
              sx={{
                position: 'absolute',
                width: 40,
                height: 40,
                bottom: -10,
                right: -10,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'orange.main',
                borderRadius: '50%',
                border: '1.5px solid #000'
              }}
            >
              <Typography fontFamily='Jura' fontSize={12} color='black.main' lineHeight={1} mb={0.25}>
                lv
              </Typography>
              <Typography fontFamily='Jura' fontSize={18} color='black.main' lineHeight={1}>
                {developer.level}
              </Typography>
            </Stack>
          </Stack>
          <Stack>
            <Typography variant='h5'>{developer.displayName}</Typography>
            <Typography color='secondary'>Joined</Typography>
            <Stack direction='row' alignItems='center' gap={1.75}>
              <Stack direction='row' gap={1} alignItems='center'>
                <Image
                  src='/images/profile/scout-game-icon.svg'
                  width={isDesktop ? '24' : '18'}
                  height={isDesktop ? '24' : '18'}
                  alt='scoutgame icon'
                />
                {joinedAtMonth} {joinedAtYear}
              </Stack>
              {developer.githubLogin ? (
                <IconButton
                  href={`https://github.com/${developer.githubLogin}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{ p: 0 }}
                >
                  <Stack direction='row' gap={1} alignItems='center'>
                    <Image
                      src='/images/profile/icons/github-circle-icon.svg'
                      width={isDesktop ? '18' : '14'}
                      height={isDesktop ? '18' : '14'}
                      alt='github icon'
                    />
                    <Typography>
                      {githubConnectedAtMonth} {githubConnectedAtYear}
                    </Typography>
                  </Stack>
                </IconButton>
              ) : null}
              {developer.farcasterUsername ? (
                <IconButton
                  href={`https://warpcast.com/${developer.farcasterUsername}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{ px: 0 }}
                >
                  <Stack direction='row' gap={1} alignItems='center'>
                    <Image
                      src='/images/profile/icons/warpcast-circle-icon.svg'
                      width={isDesktop ? '18' : '14'}
                      height={isDesktop ? '18' : '14'}
                      alt='warpcast icon'
                    />
                    <Typography>{developer.farcasterUsername}</Typography>
                  </Stack>
                </IconButton>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
        <Stack gap={0.5}>
          <Stack direction='row' gap={0.5}>
            <Stack bgcolor='primary.dark' p={1} borderRadius={1} gap={0.5} minWidth={125} width='25%'>
              <Stack>
                <Typography color='green.main'>Est. Payout</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography color='green.main' variant='h6'>
                    {developer.estimatedPayout}
                  </Typography>
                  <Image src='/images/profile/scout-game-green-icon.svg' width={24} height={24} alt='scoutgame icon' />
                </Stack>
              </Stack>
              <Stack>
                <Typography color='secondary.main'>Price</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography color='secondary.main' variant='h6'>
                    {developer.price}
                  </Typography>
                  <Image src='/images/profile/scout-game-blue-icon.svg' width={24} height={24} alt='scoutgame icon' />
                </Stack>
              </Stack>
            </Stack>
            <Stack bgcolor='primary.dark' p={1} borderRadius={1} gap={0.5} minWidth={125} width='25%'>
              <Stack>
                <Typography color='secondary.main'>Current Rank</Typography>
                <Typography variant='h6'>{developer.rank}</Typography>
              </Stack>
              <Stack>
                <Typography color='secondary.main'>Week's Gems</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant='h6'>{developer.gemsCollected}</Typography>
                  <Image src='/images/profile/icons/hex-gem-icon.svg' width={24} height={24} alt='gem icon' />
                </Stack>
              </Stack>
            </Stack>
            <Stack bgcolor='primary.dark' borderRadius={1} gap={0.5} minWidth={175} width='50%'>
              <Typography color='secondary.main' p={1}>
                14D Rank
              </Typography>
              <BuilderCardRankGraph last14DaysRank={developer.last14DaysRank} />
            </Stack>
          </Stack>
          <Stack direction='row' gap={0.5}>
            <Stack bgcolor='primary.dark' p={1} borderRadius={1} gap={0.5} minWidth={125} width='25%'>
              <Typography color='secondary.main'>This Season</Typography>
              <Stack>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant='h6'>{developer.seasonPoints}</Typography>
                  <Image src='/images/profile/scout-game-icon.svg' width={24} height={24} alt='gem icon' />
                </Stack>
                <Typography variant='h6'>{developer.scoutedBy} Scouts</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant='h6'>{developer.cardsSold}</Typography>
                  <Image src='/images/profile/icons/cards-white.svg' width={22} height={22} alt='cards sold icon' />
                  <Typography variant='h6'>Sold</Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack bgcolor='primary.dark' borderRadius={1} p={1} gap={0.5} minWidth={175} flex={1}>
              <Typography color='secondary.main'>Github Activity</Typography>
              <Stack>
                {developer.githubActivities.length > 0 ? (
                  developer.githubActivities.map((activity) => (
                    <Stack
                      key={activity.url}
                      direction='row'
                      gap={0.5}
                      alignItems='center'
                      justifyContent='space-between'
                    >
                      <Typography variant='h6' width='75%'>
                        {activity.repo}
                      </Typography>
                      <Stack width='15%' justifyContent='flex-end' direction='row' gap={0.5} alignItems='center'>
                        <Typography>{activity.gems}</Typography>
                        <Image src='/images/profile/icons/hex-gem-icon.svg' width={20} height={20} alt='gem icon' />
                      </Stack>
                      <Stack width='10%' justifyContent='flex-end' flexDirection='row'>
                        <Typography>{getShortenedRelativeTime(activity.createdAt)}</Typography>
                      </Stack>
                    </Stack>
                  ))
                ) : (
                  <Typography>No activities found</Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  );
}
