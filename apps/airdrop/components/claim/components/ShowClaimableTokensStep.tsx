import { Button, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { ConnectedWalletDisplay } from './ConnectedWalletDisplay';
import { PageLayout } from './PageLayout';

export function ShowClaimableTokensStep({
  onContinue,
  devTokenAmount
}: {
  onContinue: () => void;
  devTokenAmount: number;
}) {
  const isDesktop = useMdScreen();

  return (
    <PageLayout imageSrc='/images/hero.png' imageAlt='Airdrop Banner'>
      <Stack gap={1} alignItems='center' flex={1}>
        <Stack
          mt={{
            xs: 2,
            md: 0
          }}
        >
          <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
            Congratulations
          </Typography>
          <Typography variant='h5' textAlign='center' fontWeight={400} color='secondary'>
            for being AWESOME.
          </Typography>
        </Stack>
        <Typography variant='h6' textAlign='center'>
          You have earned DEV tokens!
        </Typography>
        <ConnectedWalletDisplay />
        <Stack flexDirection='row' gap={1} alignItems='center' my={1}>
          <Typography variant={isDesktop ? 'h4' : 'h5'} fontWeight={600}>
            {devTokenAmount}
          </Typography>
          <img
            src='/images/dev-token-logo.png'
            alt='DEV Icon'
            width={isDesktop ? 35 : 25}
            height={isDesktop ? 35 : 25}
          />
        </Stack>
        <Button variant='contained' sx={{ width: 'fit-content' }} onClick={onContinue}>
          Continue
        </Button>
      </Stack>
    </PageLayout>
  );
}
