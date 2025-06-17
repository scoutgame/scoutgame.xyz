'use client';

import InfoIcon from '@mui/icons-material/Info';
import { Container, Toolbar, AppBar, Button, Stack, IconButton, Badge } from '@mui/material';
import { isDraftSeason } from '@packages/dates/utils';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { useIsFarcasterFrame } from '@packages/scoutgame-ui/hooks/useIsFarcasterFrame';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { getPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import Link from 'next/link';
import { IoIosNotificationsOutline } from 'react-icons/io';

import { useGetUnreadNotificationsCount } from 'hooks/api/notifications';

import { AccountMenu } from './components/AccountMenu';
import { SiteNavigation } from './components/SiteNavigation';

export function Header() {
  const platform = getPlatform();
  const { user } = useUser();
  const isFarcasterFrame = useIsFarcasterFrame();
  const { data: unreadNotificationsCount } = useGetUnreadNotificationsCount();
  const draftSeason = isDraftSeason();

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
            <Link href={draftSeason ? '/' : user ? '/scout' : '/'}>
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
              {user ? (
                <>
                  <Stack direction='row' alignItems='center'>
                    <Link href='/notifications'>
                      <IconButton size='small' sx={{ mr: { xs: 1, md: unreadNotificationsCount?.count ? 1.5 : 1 } }}>
                        <Badge badgeContent={unreadNotificationsCount?.count ?? 0} color='error'>
                          <IoIosNotificationsOutline
                            style={{
                              fontSize: '26px',
                              color: 'var(--mui-palette-secondary-light)'
                            }}
                          />
                        </Badge>
                      </IconButton>
                    </Link>
                    <Link href='/info'>
                      <IconButton size='small' sx={{ mr: { xs: 1, md: 1.5 } }}>
                        <InfoIcon color='secondary' />
                      </IconButton>
                    </Link>
                  </Stack>
                  <AccountMenu user={user} />
                </>
              ) : (
                <>
                  <Link href='/info'>
                    <IconButton size='small' sx={{ mr: { xs: 1, md: 3 } }}>
                      <InfoIcon color='secondary' />
                    </IconButton>
                  </Link>
                  {platform === 'webapp' && !isFarcasterFrame && (
                    <Button variant='gradient' href='/login' data-test='sign-in-button'>
                      Sign in
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
