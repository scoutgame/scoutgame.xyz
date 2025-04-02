import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, Stack, Typography } from '@mui/material';
import { shortenHex } from '@packages/utils/strings';
import Link from 'next/link';

import { StyledAccountStack } from './StyledComponents';

interface WalletAddressProps {
  address: string;
}

export function WalletAddress({ address }: WalletAddressProps) {
  return (
    <StyledAccountStack>
      <AccountBalanceWalletOutlinedIcon fontSize='small' color='disabled' />
      <Typography variant='subtitle2' color='textDisabled'>
        Connected: {shortenHex(address, 4)}
      </Typography>
    </StyledAccountStack>
  );
}

interface PlayButtonProps {
  isDesktop: boolean;
}

export function PlayButton({ isDesktop }: PlayButtonProps) {
  return (
    <Link href='https://draft.scoutgame.xyz'>
      <Button
        variant='contained'
        sx={{
          mt: {
            xs: 1,
            md: 2
          },
          width: 'fit-content'
        }}
      >
        Play
      </Button>
    </Link>
  );
}

interface SuccessMessageProps {
  isDesktop: boolean;
  donationPercentage: 'donate_full' | 'donate_half' | 'donate_none';
}

export function SuccessMessage({ isDesktop, donationPercentage }: SuccessMessageProps) {
  return (
    <Stack
      gap={{
        xs: 1,
        md: 2
      }}
      alignItems='center'
    >
      {donationPercentage !== 'donate_full' && (
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography variant='h4' fontWeight={600} color='secondary'>
            Claim successful!
          </Typography>
          <CheckCircleIcon color='secondary' />
        </Stack>
      )}
      {donationPercentage === 'donate_full' ? (
        <>
          <Typography variant='h4' fontWeight={600} color='secondary'>
            THANK YOU for your donation!
          </Typography>
          <Typography variant='h5' textAlign='center'>
            You are an <br />
            Open Source LEGEND!
          </Typography>
        </>
      ) : (
        <Typography variant='h5' textAlign='center'>
          THANK YOU <br />
          for your donation!
        </Typography>
      )}
      {isDesktop ? (
        <Typography variant='h6' textAlign='center'>
          Now, let's go Bid on some developers and <br /> build your team before the season begins!
        </Typography>
      ) : (
        <Typography variant='h6' textAlign='center'>
          Now, let's go Bid on some developers and build your team before the season begins!
        </Typography>
      )}
      <PlayButton isDesktop={isDesktop} />
    </Stack>
  );
}
