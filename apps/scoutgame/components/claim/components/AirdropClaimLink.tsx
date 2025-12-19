'use client';

import { log } from '@charmverse/core/log';
import { Stack, Typography } from '@mui/material';
import { getCurrentSeasonStart, getPreviousNonDraftSeason } from '@packages/dates/utils';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

import { getAirdropClaimStatusAction } from 'lib/airdrop/getAirdropClaimStatusAction';

export function AirdropClaimLink() {
  const { address, chainId } = useAccount();
  const [isPreviousSeasonAirdropClaimable, setIsPreviousSeasonAirdropClaimable] = useState(false);
  const [isCurrentSeasonAirdropClaimable, setIsCurrentSeasonAirdropClaimable] = useState(false);
  const { executeAsync } = useAction(getAirdropClaimStatusAction, {
    onError: (response) => {
      log.error('Error checking airdrop status', { address, chainId, error: response.error });
      toast.error(response.error?.serverError?.message || 'Error retrieving airdrop claim status');
    }
  });

  const previousSeason = getPreviousNonDraftSeason(getCurrentSeasonStart());
  const currentSeason = getCurrentSeasonStart();

  useEffect(() => {
    if (address && previousSeason) {
      executeAsync({ address, season: previousSeason }).then((response) => {
        if (
          response &&
          response.data &&
          response.data.isValid &&
          !response.data.hasExpired &&
          !response.data.isClaimed
        ) {
          setIsPreviousSeasonAirdropClaimable(true);
        }
      });
    }
  }, [address, executeAsync, previousSeason]);

  useEffect(() => {
    if (address) {
      executeAsync({ address, season: currentSeason }).then((response) => {
        if (
          response &&
          response.data &&
          response.data.isValid &&
          !response.data.hasExpired &&
          !response.data.isClaimed
        ) {
          setIsCurrentSeasonAirdropClaimable(true);
        }
      });
    }
  }, [address, executeAsync, currentSeason]);

  if (!isPreviousSeasonAirdropClaimable && !isCurrentSeasonAirdropClaimable) {
    return null;
  }

  return (
    <>
      {isCurrentSeasonAirdropClaimable && (
        <Link href={`/airdrop?season=${currentSeason}`}>
          <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <Typography variant='h6' fontWeight='bold' color='text.secondary'>
              Claim your Airdrop (Current Season)
            </Typography>
          </Stack>
        </Link>
      )}
      {isPreviousSeasonAirdropClaimable && (
        <Link href={`/airdrop?season=${previousSeason}`}>
          <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <Typography variant='h6' fontWeight='bold' color='text.secondary'>
              Claim your Airdrop (Previous Season)
            </Typography>
          </Stack>
        </Link>
      )}
    </>
  );
}
