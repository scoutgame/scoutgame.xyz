import styled from '@emotion/styled';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyIcon from '@mui/icons-material/Key';
import { Box, Divider, Grid, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';

import Avatar from 'components/common/Avatar';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { conditionalPlural } from 'lib/utilities/strings';

const TasksPageHeaderContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: space-between;
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      flex-direction: column;
      gap: ${theme.spacing(1.5)};

      img.logo-image {
        transform: scale(0.85);
      }
    }
  `}
`;

export default function TasksPageHeader() {
  const { user } = useUser();
  const metamaskConnected = user && user?.wallets.length > 0;
  const discordConnected = user?.discordUser;
  const telegramConnected = user?.telegramUser;
  // False if undefined or 0, true if 1 or more
  const googleConnected = !!user?.googleAccounts.length;
  const totalIntegrations =
    (metamaskConnected ? 1 : 0) + (discordConnected ? 1 : 0) + (telegramConnected ? 1 : 0) + (googleConnected ? 1 : 0);
  const { data: safes } = useMultiWalletSigs();

  return (
    user && (
      <TasksPageHeaderContainer>
        <Grid container spacing={{ sm: 2, xs: 1 }}>
          <Grid item xs>
            <Paper
              component={Link}
              href='/integrations'
              elevation={1}
              sx={{
                height: '100%',
                textDecoration: 'none',
                px: {
                  xs: 1,
                  md: 3
                },
                display: 'flex',
                gap: {
                  xs: 1,
                  sm: 2
                },
                alignItems: 'center',
                cursor: 'pointer',
                justifyContent: 'space-between'
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                gap={{
                  xs: 1,
                  sm: 2
                }}
              >
                <Box display='flex' alignItems='center'>
                  <Typography
                    sx={{
                      fontSize: {
                        xs: '1.75rem',
                        sm: '2.5rem'
                      },
                      fontWeight: 'bold',
                      mr: 1
                    }}
                  >
                    {totalIntegrations}
                  </Typography>
                  <Typography
                    color='secondary'
                    sx={{
                      fontWeight: 500
                    }}
                  >
                    Connected {conditionalPlural({ word: 'Identity', plural: 'Identities', count: totalIntegrations })}
                  </Typography>
                </Box>
                <Box
                  display={{
                    xs: 'none',
                    md: 'flex'
                  }}
                  gap={{
                    xs: 1,
                    sm: 2
                  }}
                  height='100%'
                  alignItems='center'
                >
                  <Tooltip
                    title={metamaskConnected ? 'Metamask connected' : 'Metamask not connected'}
                    arrow
                    placement='top'
                  >
                    <img
                      className='logo-image'
                      width={20}
                      height={20}
                      src={
                        metamaskConnected
                          ? '/images/walletLogos/metamask.png'
                          : '/images/walletLogos/metamask-greyscale.png'
                      }
                    />
                  </Tooltip>
                  <Tooltip
                    title={discordConnected ? 'Discord connected' : 'Discord not connected'}
                    arrow
                    placement='top'
                  >
                    <img
                      className='logo-image'
                      width={25}
                      height={20}
                      src={discordConnected ? '/images/discord-logo-colored.png' : '/images/discord-logo-greyscale.png'}
                    />
                  </Tooltip>
                  <Tooltip
                    title={telegramConnected ? 'Telegram connected' : 'Telegram not connected'}
                    arrow
                    placement='top'
                  >
                    <img
                      className='logo-image'
                      width={22.5}
                      height={22.5}
                      src={telegramConnected ? '/images/telegram-logo.png' : '/images/telegram-logo-greyscale.png'}
                    />
                  </Tooltip>
                  <Tooltip title={googleConnected ? 'Google connected' : 'Google not connected'} arrow placement='top'>
                    <img
                      className='logo-image'
                      width={22.5}
                      height={22.5}
                      src={googleConnected ? '/images/Google_G.png' : '/images/Google_G-grayscale.png'}
                    />
                  </Tooltip>
                </Box>
                <Divider
                  sx={{ borderRightWidth: 2, display: { xs: 'none', lg: 'initial' } }}
                  orientation='vertical'
                  variant='middle'
                  flexItem
                />
                <Box gap={1} height='100%' alignItems='center' display={{ xs: 'none', lg: 'flex' }}>
                  <KeyIcon color='secondary' />
                  <Typography
                    color='secondary'
                    fontWeight={500}
                    sx={{
                      fontSize: {
                        sm: '1rem',
                        xs: '1.75rem'
                      }
                    }}
                  >
                    {safes?.length}
                  </Typography>
                  <Typography
                    color='secondary'
                    sx={{
                      fontWeight: 500,
                      fontSize: {
                        xs: '0.75rem',
                        sm: 'inherit'
                      }
                    }}
                  >
                    Multisig Accounts
                  </Typography>
                </Box>
              </Box>
              <IconButton>
                <ArrowForwardIosIcon color='secondary' fontSize='small' />
              </IconButton>
            </Paper>
          </Grid>
          <Grid item xs sx={{ maxWidth: '300px !important' }}>
            <Paper
              component={Link}
              href='/profile'
              elevation={1}
              sx={{
                textDecoration: 'none',
                display: 'block',
                height: '100%',
                p: 1,
                cursor: 'pointer'
              }}
            >
              <Box height='100%' display='flex' justifyContent='space-between' alignItems='center'>
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1.5}
                  sx={{
                    '.MuiAvatar-root': {
                      height: 40,
                      width: 40,
                      fontSize: '1.25rem'
                    }
                  }}
                >
                  <Avatar size='large' variant='circular' name={user.username} avatar={user.avatar} />
                  <Typography fontWeight={500} color='secondary'>
                    My Profile
                  </Typography>
                </Box>
                <IconButton>
                  <ArrowForwardIosIcon color='secondary' fontSize='small' />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TasksPageHeaderContainer>
    )
  );
}
