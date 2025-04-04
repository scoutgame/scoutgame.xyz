'use client';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import InfoIcon from '@mui/icons-material/Info';
import { AppBar, Box, Container, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { shortenHex } from '@packages/utils/strings';
import Image from 'next/image';
import { Link } from 'next-view-transitions';
import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { readContract } from 'viem/actions';
import { useAccount, useDisconnect, usePublicClient } from 'wagmi';

import { SiteNavigation } from 'components/common/Navigation/SiteNavigation';
import { WalletLogin } from 'components/common/WalletLogin';

import { useTokenBalance } from '@/hooks/useTokenBalance';

// Token address for the DEV token

export function Header() {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { address } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const isDesktop = useMdScreen();
  const { balance } = useTokenBalance();

  const disconnect = async () => {
    await disconnectAsync();
  };

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    if (anchorElUser) {
      setAnchorElUser(null);
    } else {
      setAnchorElUser(event.currentTarget);
    }
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar
      position='static'
      sx={{
        zIndex: 1,
        height: 58,
        backgroundColor: { xs: 'transparent', md: 'var(--mui-palette-AppBar-darkBg, var(--AppBar-background))' }
      }}
    >
      <Container maxWidth={false} sx={{ height: '100%' }}>
        <Toolbar
          disableGutters
          sx={{ height: '100%', justifyContent: 'space-between', alignItems: 'center' }}
          variant='dense'
        >
          <>
            <Link href='/'>
              <Image
                src='/images/scout-game-logo.png'
                width={100}
                height={45}
                alt='Scout Game logo'
                priority={true}
                style={{ verticalAlign: 'middle' }}
              />
            </Link>
            <Stack flexDirection='row' alignItems='center'>
              <Hidden mdDown>
                <SiteNavigation topNav />
              </Hidden>
              <Link href='https://scoutgame.xyz/info' target='_blank'>
                <IconButton size='small' sx={{ mr: { xs: 1, md: 1.5 } }}>
                  <InfoIcon color='secondary' />
                </IconButton>
              </Link>
              {address ? (
                <Box
                  onClick={handleOpenUserMenu}
                  borderColor='secondary.main'
                  borderRadius='30px'
                  sx={{
                    position: 'relative',
                    padding: '1px',
                    px: {
                      xs: 1,
                      md: 2
                    },
                    py: 0.25,
                    display: 'flex',
                    flexDirection: {
                      xs: 'row',
                      md: 'column'
                    },
                    gap: {
                      xs: 1,
                      md: 0
                    },
                    alignItems: {
                      xs: 'center',
                      md: 'flex-end'
                    },
                    justifyContent: 'space-between',
                    borderColor: 'secondary.main',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    cursor: 'pointer'
                  }}
                >
                  <Stack
                    flexDirection='row'
                    alignItems='center'
                    gap={{
                      xs: 0.25,
                      md: 1
                    }}
                  >
                    <Typography fontSize='16px' color='text.primary'>
                      {Number(balance)}
                    </Typography>
                    <Image
                      src='/images/dev-token-logo.png'
                      width={18}
                      height={18}
                      alt='DEV token icon'
                      priority={true}
                    />
                  </Stack>
                  <Stack flexDirection='row' alignItems='center' gap={1}>
                    <AccountBalanceWalletOutlinedIcon color='disabled' sx={{ fontSize: '16px' }} />
                    <Typography color='textDisabled' fontSize='16px'>
                      {shortenHex(address, isDesktop ? 4 : 3)}
                    </Typography>
                  </Stack>
                  <Menu
                    sx={{ mt: 5 }}
                    slotProps={{
                      paper: { sx: { '.MuiList-root': { pb: 0 }, maxWidth: '250px' } }
                    }}
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right'
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right'
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    onClick={handleCloseUserMenu}
                  >
                    <MenuItem onClick={disconnect}>Disconnect</MenuItem>
                  </Menu>
                </Box>
              ) : (
                <WalletLogin />
              )}
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
