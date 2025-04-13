import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BuilderCardRankGraph } from '../Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';

const dialogPaperBgColor = 'background.dark';

export function DeveloperInfoCard({
  onClose,
  developer,
  children
}: {
  onClose: () => void;
  developer: DeveloperInfo;
  children?: ReactNode;
}) {
  const isDesktop = useMdScreen();
  const firstContributionDate = DateTime.fromISO(developer.firstContributionDate.toISOString());
  const firstContributionDateMonth = firstContributionDate.monthShort;
  const firstContributionDateYear = firstContributionDate.year;

  const githubConnectedAt = DateTime.fromISO(developer.githubConnectedAt.toISOString());
  const githubConnectedAtMonth = githubConnectedAt.monthShort;
  const githubConnectedAtYear = githubConnectedAt.year;

  return (
    <Stack gap={2}>
      <Stack direction='row' alignItems='center' gap={2}>
        <Stack position='relative'>
          <Avatar
            src={developer.avatar}
            name={developer.displayName}
            size={isDesktop ? 'xLarge' : 'large'}
            variant='circular'
          />
          <Stack
            sx={{
              position: 'absolute',
              width: {
                xs: 32,
                md: 40
              },
              height: {
                xs: 32,
                md: 40
              },
              bottom: {
                xs: -8,
                md: -10
              },
              right: {
                xs: -8,
                md: -10
              },
              backgroundColor: 'orange.main',
              borderRadius: '50%',
              border: '1.5px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              fontFamily='Jura'
              fontSize={{
                xs: 10,
                md: 12
              }}
              color='black.main'
              lineHeight={1}
              mb={0.25}
            >
              lv
            </Typography>
            <Typography
              fontFamily='Jura'
              fontSize={{
                xs: 12,
                md: 18
              }}
              fontWeight='bold'
              color='black.main'
              lineHeight={1}
            >
              {developer.level}
            </Typography>
          </Stack>
        </Stack>
        <Stack>
          <Stack
            direction='row'
            alignItems='center'
            gap={{
              xs: 0.5,
              md: 1
            }}
          >
            <Typography
              variant={isDesktop ? 'h5' : 'h6'}
              maxWidth={{
                xs: 150,
                md: 250
              }}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {developer.displayName}
            </Typography>
            <Link href={`/u/${developer.path}`} onClick={onClose}>
              <Button
                sx={{
                  p: 0,
                  '& .MuiButton-startIcon': {
                    mr: 0.5
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: {
                      xs: 12,
                      md: 14
                    }
                  }
                }}
                variant='text'
                startIcon={<OpenInNewIcon sx={{ fontSize: { xs: '12px !important', md: '14px !important' } }} />}
                color='secondary'
                size='small'
              >
                <Typography color='secondary' fontSize='12px'>
                  View {isDesktop ? 'Profile' : ''}
                </Typography>
              </Button>
            </Link>
          </Stack>
          <Typography color='secondary'>Joined</Typography>
          <Stack
            direction='row'
            alignItems='center'
            gap={{
              xs: 1,
              md: 1.75
            }}
          >
            <Stack
              direction='row'
              gap={{
                xs: 0.5,
                md: 1
              }}
              alignItems='center'
            >
              <Image
                src='/images/icons/binoculars.svg'
                width={isDesktop ? '24' : '18'}
                height={isDesktop ? '24' : '18'}
                alt='scoutgame icon'
              />
              <Typography
                fontSize={{
                  xs: 14
                }}
              >
                {firstContributionDateMonth} {firstContributionDateYear}
              </Typography>
            </Stack>
            {developer.githubLogin ? (
              <IconButton
                href={`https://github.com/${developer.githubLogin}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
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
                  <Typography
                    fontSize={{
                      xs: 14
                    }}
                  >
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
                sx={{
                  p: 0
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Stack direction='row' gap={1} alignItems='center'>
                  <Image
                    src='/images/profile/icons/warpcast-circle-icon.svg'
                    width={isDesktop ? '18' : '14'}
                    height={isDesktop ? '18' : '14'}
                    alt='warpcast icon'
                  />
                  <Typography
                    sx={{
                      fontSize: {
                        xs: 14
                      },
                      maxWidth: {
                        xs: 90
                      },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {developer.farcasterUsername}
                  </Typography>
                </Stack>
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
      <Stack gap={0.5}>
        <Stack direction='row' gap={0.5}>
          <Stack
            bgcolor={dialogPaperBgColor}
            p={{
              xs: 0.5,
              md: 1
            }}
            borderRadius={1}
            gap={0.5}
            minWidth={{
              xs: 100,
              md: 125
            }}
            width='25%'
          >
            <Stack>
              <Typography color='secondary.main'>
                <Typography
                  component='span'
                  display={{
                    xs: 'none',
                    md: 'inline'
                  }}
                  color='secondary.main'
                >
                  Current
                </Typography>{' '}
                Rank
              </Typography>
              <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.rank}</Typography>
            </Stack>
            <Stack>
              <Typography color='secondary.main'>
                <Typography
                  component='span'
                  display={{
                    xs: 'none',
                    md: 'inline'
                  }}
                  color='secondary.main'
                >
                  Week's
                </Typography>{' '}
                Gems
              </Typography>
              <Stack direction='row' gap={0.5} alignItems='center'>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.gemsCollected}</Typography>
                <Image
                  src='/images/icons/gem.svg'
                  width={isDesktop ? '24' : '18'}
                  height={isDesktop ? '24' : '18'}
                  alt='gem icon'
                />
              </Stack>
            </Stack>
          </Stack>
          <Stack
            bgcolor={dialogPaperBgColor}
            borderRadius={1}
            flex={1}
            height={{
              xs: 115,
              md: 140
            }}
          >
            <Typography
              color='secondary.main'
              p={{
                xs: 0.5,
                md: 1
              }}
            >
              14D Rank
            </Typography>
            <Stack height='calc(100% - 16px)'>
              <BuilderCardRankGraph ranks={developer.last14DaysRank} />
            </Stack>
          </Stack>
          <Stack
            bgcolor={dialogPaperBgColor}
            p={{
              xs: 0.5,
              md: 1
            }}
            borderRadius={1}
            gap={0.5}
            minWidth={{
              xs: 100,
              md: 125
            }}
            width='25%'
          >
            <Typography color='secondary.main' component='span'>
              <Typography
                component='span'
                display={{
                  xs: 'none',
                  md: 'inline'
                }}
                color='secondary.main'
              >
                This
              </Typography>{' '}
              Season
            </Typography>
            <Stack>
              <Stack direction='row' gap={0.5} alignItems='center'>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.seasonPoints}</Typography>
                <Image
                  src='/images/icons/binoculars.svg'
                  width={isDesktop ? '24' : '18'}
                  height={isDesktop ? '24' : '18'}
                  alt='gem icon'
                />
              </Stack>
              <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.scoutedBy} Scouts</Typography>
              <Stack direction='row' gap={0.5} alignItems='center'>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.cardsSold}</Typography>
                <Image
                  src='/images/profile/icons/cards-white.svg'
                  width={isDesktop ? 22 : 18}
                  height={isDesktop ? 22 : 18}
                  alt='cards sold icon'
                />
                <Typography variant={isDesktop ? 'h6' : 'body1'}>Sold</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
        <Stack
          bgcolor={dialogPaperBgColor}
          borderRadius={1}
          p={{
            xs: 0.5,
            md: 1
          }}
          gap={0.5}
          minWidth={175}
          flex={1}
        >
          <Typography color='secondary.main'>Github Activity</Typography>
          <Stack>
            {developer.githubActivities.length > 0 ? (
              developer.githubActivities.map((activity) => (
                <Link
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  href={activity.url}
                  key={activity.url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Stack
                    key={activity.url}
                    direction='row'
                    gap={0.75}
                    alignItems='center'
                    justifyContent='space-between'
                  >
                    <Avatar src={activity.avatar} name={activity.repo} size='xSmall' variant='rounded' />
                    <Typography
                      variant={isDesktop ? 'h6' : 'body1'}
                      width={{
                        xs: '65%',
                        md: '75%'
                      }}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.repo}
                    </Typography>
                    <Stack
                      width={{
                        xs: '20%',
                        md: '15%'
                      }}
                      justifyContent='flex-end'
                      direction='row'
                      gap={0.5}
                      alignItems='center'
                    >
                      <Typography>{activity.gems}</Typography>
                      <Image
                        src='/images/icons/gem.svg'
                        width={isDesktop ? '20' : '16'}
                        height={isDesktop ? '20' : '16'}
                        alt='gem icon'
                      />
                    </Stack>
                    <Stack
                      width={{
                        xs: '15%',
                        md: '10%'
                      }}
                      justifyContent='flex-end'
                      flexDirection='row'
                    >
                      <Typography>{getShortenedRelativeTime(activity.createdAt)}</Typography>
                    </Stack>
                  </Stack>
                </Link>
              ))
            ) : (
              <Typography>No activity in the last 30 days.</Typography>
            )}
          </Stack>
        </Stack>
        {children}
      </Stack>
    </Stack>
  );
}
