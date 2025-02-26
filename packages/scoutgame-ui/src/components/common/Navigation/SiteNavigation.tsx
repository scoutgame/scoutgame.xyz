'use client';

import sdk from '@farcaster/frame-sdk';
import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import { getPlatform } from '@packages/utils/platform';
import { DateTime } from 'luxon';
import { usePathname } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { useEffect, useState } from 'react';
import { ImGift as QuestsIcon } from 'react-icons/im';
import { PiBinocularsLight as ScoutIcon } from 'react-icons/pi';

import { useGetQuests } from '../../../hooks/api/quests';
import { useGetClaimablePoints } from '../../../hooks/api/session';
import { useUser } from '../../../providers/UserProvider';
import { BuilderIcon } from '../Icons/BuilderIcon';
import { ClaimIcon } from '../Icons/ClaimIcon';
import { SignInModalMessage } from '../ScoutButton/SignInModalMessage';

const StyledBottomNavigation = styled(BottomNavigation, {
  shouldForwardProp: (prop) => prop !== 'topNav' && prop !== 'largerNavbar'
})<{ topNav?: boolean; largerNavbar?: boolean }>(({ theme, topNav, largerNavbar }) => ({
  background: topNav
    ? 'transparent'
    : 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
  height: largerNavbar ? '71px' : undefined,
  '& > a': {
    color: topNav ? theme.palette.text.primary : theme.palette.common.black,
    gap: '2px',
    width: topNav ? '110px' : 'auto',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&.Mui-selected': {
      color: theme.palette.text.primary,
      backgroundColor: topNav ? theme.palette.primary.main : 'rgba(44, 0, 90, 0.25)'
    },
    '&.MuiButtonBase-root': {
      paddingBottom: largerNavbar ? '15px' : undefined,
      minWidth: '60px'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  const platform = getPlatform();
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthenticated = Boolean(user);
  const value = getActiveButton(pathname);
  const { data: claimablePoints = { points: 0, processingPayouts: false } } = useGetClaimablePoints();
  const { data: dailyClaims = [] } = useGetQuests();
  const todaysClaim = dailyClaims?.find((claim) => {
    const currentWeekDay = DateTime.utc().weekday;
    const isClaimToday = currentWeekDay === claim.day;
    return isClaimToday;
  });
  const [isFarcasterFrameContext, setIsFarcasterFrameContext] = useState(false);

  const canClaim = todaysClaim ? !todaysClaim?.claimed : false;
  const [authPopup, setAuthPopup] = useState({
    open: false,
    path: 'scout'
  });

  useEffect(() => {
    async function checkFarcasterFrameContext() {
      const context = await sdk.context;
      if (context) {
        setIsFarcasterFrameContext(true);
      }
    }
    checkFarcasterFrameContext();
  }, []);

  return (
    <>
      <StyledBottomNavigation
        showLabels
        value={value}
        data-test='site-navigation'
        topNav={topNav}
        largerNavbar={platform === 'telegram' || isFarcasterFrameContext}
      >
        <BottomNavigationAction
          label='Scout'
          href='/scout'
          value='scout'
          icon={<ScoutIcon size='24px' />}
          LinkComponent={Link}
        />
        <BottomNavigationAction
          label='Developers'
          href='/developers'
          value='developers'
          icon={<BuilderIcon />}
          LinkComponent={Link}
        />
        <BottomNavigationAction
          LinkComponent={Link}
          label='Claim'
          href={isAuthenticated ? '/claim' : '#'}
          value='claim'
          icon={<ClaimIcon animate={claimablePoints.points > 0 && !claimablePoints.processingPayouts} />}
          onClick={(e) => {
            if (!isAuthenticated) {
              setAuthPopup({ open: true, path: 'claim' });
            }
          }}
        />
        <BottomNavigationAction
          label='Quests'
          href={isAuthenticated ? '/quests' : '#'}
          value='quests'
          icon={
            <QuestsIcon
              size='24px'
              style={{
                animation: canClaim ? 'wiggle 2s ease-in-out infinite' : 'none'
              }}
            />
          }
          LinkComponent={Link}
          onClick={(e) => {
            if (!isAuthenticated) {
              setAuthPopup({ open: true, path: 'quests' });
            }
          }}
        />
      </StyledBottomNavigation>
      <SignInModalMessage
        open={authPopup.open}
        onClose={() => setAuthPopup({ open: false, path: authPopup.path })}
        path={authPopup.path}
      />
    </>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.startsWith('/scout') || pathname.startsWith('/u/')) {
    return 'scout';
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  } else if (pathname.startsWith('/developers')) {
    return 'developers';
  } else if (pathname.startsWith('/quests')) {
    return 'quests';
  }
  return null;
}
