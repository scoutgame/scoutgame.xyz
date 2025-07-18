'use client';

import { BottomNavigationAction } from '@mui/material';
import { isDraftSeason, isEndOfDraftWeek } from '@packages/dates/utils';
import { StyledBottomNavigation } from '@packages/scoutgame-ui/components/common/BottomNavigation';
import { BuilderIcon } from '@packages/scoutgame-ui/components/common/Icons/BuilderIcon';
import { ClaimIcon } from '@packages/scoutgame-ui/components/common/Icons/ClaimIcon';
import { useGetClaimableTokens } from '@packages/scoutgame-ui/hooks/api/session';
import { useIsFarcasterFrame } from '@packages/scoutgame-ui/hooks/useIsFarcasterFrame';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { getPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { PiBinocularsLight as ScoutIcon } from 'react-icons/pi';

import { SignInModalMessage } from 'components/common/ScoutButton/SignInModalMessage';
import { isAirdropLive } from 'lib/airdrop/checkAirdropDates';

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  const platform = getPlatform();
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthenticated = Boolean(user);
  const value = getActiveButton(pathname);
  const { data: claimableTokens = { tokens: 0, processingPayouts: false } } = useGetClaimableTokens();
  const isFarcasterFrame = useIsFarcasterFrame();

  const [authPopup, setAuthPopup] = useState({
    open: false,
    path: 'scout'
  });

  const draftSeason = isDraftSeason();
  const airdropLive = isAirdropLive();

  if (draftSeason) {
    return (
      <>
        <StyledBottomNavigation
          showLabels
          value={value}
          data-test='site-navigation'
          topNav={topNav}
          largerNavbar={platform === 'telegram' || isFarcasterFrame}
        >
          {airdropLive ? (
            <BottomNavigationAction
              label='Airdrop'
              href='/airdrop'
              value='airdrop'
              icon={<ClaimIcon />}
              LinkComponent={Link}
            />
          ) : null}
          {isEndOfDraftWeek() ? null : (
            <BottomNavigationAction
              label='Draft'
              href='/draft'
              value='draft'
              icon={<ScoutIcon size='24px' />}
              LinkComponent={Link}
            />
          )}
        </StyledBottomNavigation>
        <SignInModalMessage
          open={authPopup.open}
          onClose={() => setAuthPopup({ open: false, path: authPopup.path })}
          path={authPopup.path}
        />
      </>
    );
  }

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
          icon={<ClaimIcon animate={claimableTokens.tokens > 0 && !claimableTokens.processingPayouts} />}
          onClick={(e) => {
            if (!isAuthenticated) {
              setAuthPopup({ open: true, path: 'claim' });
            }
          }}
        />
        {/* <BottomNavigationAction
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
        /> */}
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
  } else if (pathname.startsWith('/airdrop')) {
    return 'airdrop';
  }
  return null;
}
