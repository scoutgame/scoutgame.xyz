'use client';

import { BottomNavigationAction } from '@mui/material';
import { StyledBottomNavigation } from '@packages/scoutgame-ui/components/common/BottomNavigation';
import { BuilderIcon } from '@packages/scoutgame-ui/components/common/Icons/BuilderIcon';
import { ClaimIcon } from '@packages/scoutgame-ui/components/common/Icons/ClaimIcon';
import { useGetClaimablePoints } from '@packages/scoutgame-ui/hooks/api/session';
import { useIsFarcasterFrame } from '@packages/scoutgame-ui/hooks/useIsFarcasterFrame';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { getPlatform } from '@packages/utils/platform';
import { DateTime } from 'luxon';
import { usePathname } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { useState } from 'react';
import { ImGift as QuestsIcon } from 'react-icons/im';
import { PiBinocularsLight as ScoutIcon } from 'react-icons/pi';

import { useGetQuests } from 'hooks/api/quests';

import { SignInModalMessage } from '../ScoutButton/SignInModalMessage';

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
  const isFarcasterFrame = useIsFarcasterFrame();

  const canClaim = todaysClaim ? !todaysClaim?.claimed : false;
  const [authPopup, setAuthPopup] = useState({
    open: false,
    path: 'scout'
  });

  return (
    <>
      <StyledBottomNavigation
        showLabels
        value={value}
        data-test='site-navigation'
        topNav={topNav}
        largerNavbar={platform === 'telegram' || isFarcasterFrame}
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
