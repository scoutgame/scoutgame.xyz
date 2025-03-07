import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { Avatar } from '../Avatar';
import { BuilderCardRankGraph } from '../Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';
import { Dialog } from '../Dialog';
import { ScoutButton } from '../ScoutButton/ScoutButton';

export function DeveloperInfoModal({
  onClose,
  developer,
  isLoading
}: {
  onClose: () => void;
  developer: DeveloperInfo | null;
  isLoading: boolean;
}) {
  const isDesktop = useMdScreen();

  if (isLoading) {
    return (
      <Dialog
        open
        onClose={onClose}
        sx={{
          '& .MuiDialogContent-root': {
            p: {
              xs: 1,
              md: 2
            }
          },
          '& .MuiDialog-paper': {
            pt: {
              xs: 1,
              md: 2
            },
            minWidth: {
              xs: '100%',
              md: 600
            },
            bgcolor: 'black.main',
            borderRadius: 2
          }
        }}
      >
        <Stack
          gap={{
            xs: 1,
            md: 2
          }}
        >
          <Stack
            direction='row'
            gap={{
              xs: 1,
              md: 2
            }}
          >
            <Skeleton
              variant='circular'
              sx={{
                width: {
                  xs: 75,
                  md: 100
                },
                height: {
                  xs: 75,
                  md: 100
                }
              }}
            />
            <Stack
              gap={{
                xs: 1,
                md: 2
              }}
            >
              <Skeleton variant='text' width={150} height={25} />
              <Skeleton variant='text' width={50} height={15} />
              <Stack
                direction='row'
                gap={{
                  xs: 1,
                  md: 2
                }}
              >
                <Stack direction='row' gap={1}>
                  <Skeleton variant='circular' width={20} height={20} />
                  <Skeleton variant='text' width={100} height={20} />
                </Stack>
                <Stack direction='row' gap={1}>
                  <Skeleton variant='circular' width={20} height={20} />
                  <Skeleton variant='text' width={100} height={20} />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
          <Stack gap={0.5}>
            <Stack direction='row' gap={0.5}>
              <Skeleton
                variant='text'
                sx={{
                  width: {
                    xs: '33.33%',
                    md: 150
                  }
                }}
                height={125}
              />
              <Skeleton
                variant='text'
                sx={{
                  width: {
                    xs: '33.33%',
                    md: 150
                  }
                }}
                height={125}
              />
              <Skeleton
                variant='text'
                sx={{
                  width: {
                    xs: '33.33%',
                    md: 'calc(100% - 300px)'
                  }
                }}
                height={125}
              />
            </Stack>
            <Stack direction='row' gap={0.5}>
              <Skeleton
                variant='text'
                sx={{
                  width: {
                    xs: '33.33%',
                    md: 150
                  }
                }}
                height={125}
              />
              <Skeleton
                variant='text'
                sx={{
                  width: {
                    xs: '66.66%',
                    md: `calc(100% - 150px)`
                  }
                }}
                height={125}
              />
            </Stack>
          </Stack>
        </Stack>
      </Dialog>
    );
  }

  if (!developer) {
    return null;
  }

  const firstContributionDate = DateTime.fromISO(developer.firstContributionDate.toISOString());
  const firstContributionDateMonth = firstContributionDate.monthShort;
  const firstContributionDateYear = firstContributionDate.year;

  const githubConnectedAt = DateTime.fromISO(developer.githubConnectedAt.toISOString());
  const githubConnectedAtMonth = githubConnectedAt.monthShort;
  const githubConnectedAtYear = githubConnectedAt.year;

  return (
    <Dialog
      open
      onClose={onClose}
      sx={{
        '& .MuiDialogContent-root': {
          p: {
            xs: 1
          }
        },
        '& .MuiDialog-paper': {
          minWidth: {
            xs: '100%',
            md: 600
          },
          bgcolor: 'black.main',
          borderRadius: 2
        }
      }}
    >
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
                  src='/images/profile/scout-game-icon.svg'
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
              bgcolor='primary.dark'
              p={{
                xs: 0.5,
                md: 1
              }}
              borderRadius={1}
              gap={0.5}
              minWidth={125}
              width='25%'
            >
              <Stack>
                <Typography color='green.main'>Est. Payout</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography color='green.main' variant={isDesktop ? 'h6' : 'body1'}>
                    {developer.estimatedPayout}
                  </Typography>
                  <Image
                    src='/images/profile/scout-game-green-icon.svg'
                    width={isDesktop ? '24' : '18'}
                    height={isDesktop ? '24' : '18'}
                    alt='scoutgame icon'
                  />
                </Stack>
              </Stack>
              <Stack
                gap={0.5}
                onClick={() => {
                  onClose();
                }}
              >
                <Typography color='secondary.main'>Buy now</Typography>
                <ScoutButton
                  builder={{
                    builderStatus: 'applied',
                    id: developer.id,
                    displayName: developer.displayName,
                    path: developer.path,
                    price: developer.price,
                    nftImageUrl: developer.nftImageUrl,
                    avatar: developer.avatar,
                    congratsImageUrl: developer.congratsImageUrl
                  }}
                  type='default'
                />
              </Stack>
            </Stack>
            <Stack
              bgcolor='primary.dark'
              p={{
                xs: 0.5,
                md: 1
              }}
              borderRadius={1}
              gap={0.5}
              minWidth={125}
              width='25%'
            >
              <Stack>
                <Typography color='secondary.main'>Current Rank</Typography>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.rank}</Typography>
              </Stack>
              <Stack>
                <Typography color='secondary.main'>Week's Gems</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.gemsCollected}</Typography>
                  <Image
                    src='/images/profile/icons/hex-gem-icon.svg'
                    width={isDesktop ? '24' : '18'}
                    height={isDesktop ? '24' : '18'}
                    alt='gem icon'
                  />
                </Stack>
              </Stack>
            </Stack>
            <Stack bgcolor='primary.dark' borderRadius={1} gap={0.5} flex={1}>
              <Typography
                color='secondary.main'
                p={{
                  xs: 0.5,
                  md: 1
                }}
              >
                14D Rank
              </Typography>
              <BuilderCardRankGraph last14DaysRank={developer.last14DaysRank} />
            </Stack>
          </Stack>
          <Stack direction='row' gap={0.5}>
            <Stack
              bgcolor='primary.dark'
              p={{
                xs: 0.5,
                md: 1
              }}
              borderRadius={1}
              gap={0.5}
              minWidth={125}
              width='25%'
            >
              <Typography color='secondary.main'>This Season</Typography>
              <Stack>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.seasonPoints}</Typography>
                  <Image
                    src='/images/profile/scout-game-icon.svg'
                    width={isDesktop ? '24' : '18'}
                    height={isDesktop ? '24' : '18'}
                    alt='gem icon'
                  />
                </Stack>
                <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.scoutedBy} Scouts</Typography>
                <Stack direction='row' gap={0.5} alignItems='center'>
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>{developer.cardsSold}</Typography>
                  <Image src='/images/profile/icons/cards-white.svg' width={22} height={22} alt='cards sold icon' />
                  <Typography variant={isDesktop ? 'h6' : 'body1'}>Sold</Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack bgcolor='primary.dark' borderRadius={1} p={1} gap={0.5} minWidth={175} flex={1}>
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
                            src='/images/profile/icons/hex-gem-icon.svg'
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
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  );
}
