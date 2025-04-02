'use client';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Button, Stack, Typography } from '@mui/material';
import { shortenHex } from '@packages/utils/strings';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from 'wagmi';

const DEV_TOKEN_AMOUNT = 2500;

export function ClaimToken() {
  const { address = '0x1234566789012345678901234567890123456789' } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);

  if (!address) {
    return (
      <Stack gap={2}>
        <Typography variant='h4' color='secondary'>
          Claim period for <br />
          Season 1 Rewards is OPEN!
        </Typography>
        <Typography variant='h6'>
          If you earned points in the Preaseason, you've <br />
          secured your place in the airdrop! Claim your DEV <br />
          tokens at the start of each season for the next 10 <br />
          seasons.
        </Typography>
        <Link href='/login'>
          <Button sx={{ width: 'fit-content' }}>Start</Button>
        </Link>
      </Stack>
    );
  }

  return (
    <Stack gap={1} alignItems='center'>
      <Stack>
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
      <Stack
        sx={{
          borderColor: 'text.disabled',
          borderWidth: '1px',
          borderStyle: 'solid',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          borderRadius: '15px',
          px: 1,
          py: 0.5,
          width: 'fit-content'
        }}
      >
        <AccountBalanceWalletOutlinedIcon fontSize='small' color='disabled' />
        <Typography variant='subtitle2' color='textDisabled'>
          Connected: {shortenHex(address, 4)}
        </Typography>
      </Stack>
      <Stack flexDirection='row' gap={1} alignItems='center' my={1}>
        <Typography variant='h4' fontWeight={600}>
          {DEV_TOKEN_AMOUNT}
        </Typography>
        <Image src='/images/dev-token-logo.png' alt='DEV Icon' width={35} height={35} />
      </Stack>
      <Button variant='contained' sx={{ width: 'fit-content' }}>
        Continue
      </Button>
    </Stack>
  );
}
