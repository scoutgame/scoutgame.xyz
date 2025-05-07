'use client';

import { log } from '@charmverse/core/log';
import { Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

import { getAirdropClaimStatusAction } from 'lib/airdrop/getAirdropClaimStatusAction';

export function AirdropClaimLink() {
  const { address, chainId } = useAccount();
  const [isAirdropClaimable, setIsAirdropClaimable] = useState(false);
  const { executeAsync } = useAction(getAirdropClaimStatusAction, {
    onError: (response) => {
      log.error('Error checking airdrop status', { address, chainId, error: response.error });
      toast.error(response.error?.serverError?.message || 'Error retrieving airdrop claim status');
    }
  });

  useEffect(() => {
    if (address) {
      executeAsync({ address }).then((response) => {
        if (
          response &&
          response.data &&
          response.data.isValid &&
          !response.data.hasExpired &&
          !response.data.isClaimed
        ) {
          setIsAirdropClaimable(true);
        }
      });
    }
  }, [address, executeAsync]);

  if (!isAirdropClaimable) {
    return null;
  }

  return (
    <Link href='/airdrop'>
      <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
        <Typography variant='h6' fontWeight='bold' color='text.secondary'>
          Claim your Airdrop
        </Typography>
      </Stack>
    </Link>
  );
}
