import { Stack } from '@mui/material';

import { InfoPageFooter } from 'components/info/components/InfoPageFooter';

import { HowToPlaySection } from '../../partners/PartnerLandingPage';

import { FooterSection } from './FooterSection';

export function ScoutsInfo() {
  return (
    <Stack height='100%'>
      <HowToPlaySection title='Scout Game for Developers' activeBorder />
      <FooterSection />
      <Stack>
        <InfoPageFooter />
      </Stack>
    </Stack>
  );
}
