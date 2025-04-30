'use client';

import { log } from '@charmverse/core/log';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Box, Menu, MenuItem, Typography, Stack, CircularProgress } from '@mui/material';
import { isDraftSeason } from '@packages/dates/utils';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { logoutAction } from '@packages/nextjs/session/logoutAction';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { WalletLogin } from '@packages/scoutgame-ui/components/common/WalletLogin/WalletLogin';
import { useIsFarcasterFrame } from '@packages/scoutgame-ui/hooks/useIsFarcasterFrame';
import { useMdScreen, useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { ceilToPrecision } from '@packages/utils/numbers';
import { getPlatform } from '@packages/utils/platform';
import { shortenHex } from '@packages/utils/strings';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { useDevTokenBalance } from '../../../hooks/useDevTokenBalance';

export function AccountMenu({ user }: { user: SessionUser }) {
  const isDesktop = useMdScreen();
  const { refreshUser } = useUser();
  const { address } = useAccount();
  const router = useRouter();
  const { balance, isLoading: isLoadingBalance } = useDevTokenBalance({ address });
  const platform = getPlatform();
  const isFarcasterFrame = useIsFarcasterFrame();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser, isExecuting: isExecutingLogout } = useAction(logoutAction, {
    onSuccess: async () => {
      await refreshUser();
      revalidatePathAction();
      router.push('/');
    },
    onError(err) {
      log.error('Error on logout', { error: err.error.serverError });
    }
  });

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  return (
    <>
      <Box
        onClick={handleOpenUserMenu}
        borderColor='secondary.main'
        borderRadius='30px'
        sx={{
          padding: '1px',
          pl: {
            xs: 1
          },
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderColor: 'secondary.main',
          borderWidth: '2px',
          borderStyle: 'solid',
          cursor: 'pointer'
        }}
      >
        {address ? (
          <BalanceDisplay balance={balance} isLoadingBalance={isLoadingBalance} address={address} />
        ) : (
          // this div is needed to prevent the account menu from opening when clicking the connect wallet button
          <div onClick={(e) => e.stopPropagation()}>
            <WalletLogin
              size='small'
              variant='text'
              sx={{
                background: 'transparent !important',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: 'white'
                },
                height: '40px',
                color: 'grey',
                minWidth: '100px',
                fontSize: 14,
                ml: 1
              }}
              text='Connect'
            />
          </div>
        )}
        <Avatar src={user.avatar || undefined} size='medium' name={user.displayName || ''} />
      </Box>
      <Menu
        sx={{ mt: 5 }}
        id='menu-appbar'
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
        <MenuItem component={Link} href='/profile' data-test='user-profile-button'>
          {user.displayName}
        </MenuItem>
        <MenuItem component={Link} href='/accounts'>
          Accounts
        </MenuItem>
        {(user.builderStatus === 'approved' || (user.builderStatus === 'applied' && user.utmCampaign === 'taiko')) &&
        !isDraftSeason ? (
          <MenuItem component={Link} href='/profile/projects'>
            Projects
          </MenuItem>
        ) : null}
        {platform === 'webapp' && !isFarcasterFrame && (
          <MenuItem onClick={() => logoutUser()} data-test='sign-out-button'>
            Sign Out
          </MenuItem>
        )}
        {/* <InstallAppMenuItem>Install</InstallAppMenuItem> */}
      </Menu>
    </>
  );
}

function BalanceDisplay({
  balance,
  isLoadingBalance,
  address
}: {
  balance: number;
  isLoadingBalance: boolean;
  address: string;
}) {
  const isDesktop = useSmScreen();
  return (
    <Box
      display='flex'
      flexDirection={{ xs: 'row', sm: 'column' }}
      alignItems={{ xs: 'center', sm: 'flex-end' }}
      gap={{ xs: 1, sm: 0 }}
      px={1}
    >
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography
          fontSize='16px'
          lineHeight='100%'
          component='span'
          color='text.primary'
          data-test='user-points-balance'
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {isLoadingBalance ? (
            <>
              {/* include &nbsp; so the height is consistent */}
              &nbsp;
              <CircularProgress size={14} color='inherit' sx={{ opacity: 0.5, pb: 1 }} />
            </>
          ) : (
            ceilToPrecision(balance, 4).toLocaleString()
          )}
        </Typography>

        <Image src='/images/dev-token-logo.png' width={18} height={18} alt='DEV token icon' priority={true} />
      </Stack>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <AccountBalanceWalletOutlinedIcon
          color='disabled'
          sx={{ fontSize: '14px', display: { xs: 'none', sm: 'block' } }}
        />
        <Typography color='textDisabled' fontSize='12px'>
          {shortenHex(address, isDesktop ? 4 : 3)}
        </Typography>
      </Stack>
    </Box>
  );
}
