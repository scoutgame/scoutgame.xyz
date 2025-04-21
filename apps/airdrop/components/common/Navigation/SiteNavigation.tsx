'use client';

import { BottomNavigationAction } from '@mui/material';
import { StyledBottomNavigation } from '@packages/scoutgame-ui/components/common/BottomNavigation';
import { ClaimIcon } from '@packages/scoutgame-ui/components/common/Icons/ClaimIcon';
import { Link } from 'next-view-transitions';
import { PiBinocularsLight as ScoutIcon } from 'react-icons/pi';

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  return (
    <StyledBottomNavigation showLabels value='airdrop' data-test='site-navigation' topNav={topNav}>
      <BottomNavigationAction label='Airdrop' href='/' value='airdrop' icon={<ClaimIcon />} LinkComponent={Link} />
      <BottomNavigationAction
        label='Draft'
        href='https://draft.scoutgame.xyz'
        value='draft'
        icon={<ScoutIcon size='24px' />}
        LinkComponent={Link}
      />
    </StyledBottomNavigation>
  );
}
