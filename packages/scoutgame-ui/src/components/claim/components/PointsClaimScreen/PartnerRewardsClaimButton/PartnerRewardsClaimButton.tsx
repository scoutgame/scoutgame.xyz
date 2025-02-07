'use client';

import { LoadingButton } from '@mui/lab';
import { Button, Dialog, Stack, Typography } from '@mui/material';
import type { UnclaimedPartnerReward } from '@packages/scoutgame/points/getPartnerRewards';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { Address } from 'viem';

import { revalidateClaimPointsAction } from '../../../../../actions/revalidateClaimPointsAction';

import { useClaimPartnerReward } from './useClaimPartnerReward';

export function PartnerRewardsClaimButton({ partnerReward }: { partnerReward: UnclaimedPartnerReward }) {
  const [showPartnerRewardModal, setShowPartnerRewardModal] = useState(false);
  const { executeAsync: revalidateClaimPoints } = useAction(revalidateClaimPointsAction);
  const { claimPartnerReward, isClaiming } = useClaimPartnerReward({
    payoutId: partnerReward.id,
    contractAddress: partnerReward.contractAddress as Address,
    rewardChainId: partnerReward.chainId,
    recipientAddress: partnerReward.recipientAddress as Address,
    onSuccess: () => {
      setShowPartnerRewardModal(false);
      revalidateClaimPoints();
    }
  });

  return (
    <>
      <LoadingButton
        variant='contained'
        color='primary'
        sx={{ width: 'fit-content' }}
        loading={isClaiming}
        disabled={isClaiming}
        onClick={() => setShowPartnerRewardModal(true)}
      >
        Claim
      </LoadingButton>
      {showPartnerRewardModal && (
        <Dialog
          open={showPartnerRewardModal}
          onClose={() => setShowPartnerRewardModal(false)}
          PaperProps={{
            sx: {
              width: '100%'
            }
          }}
        >
          <Stack
            sx={{
              p: 2,
              gap: 1.5,
              width: '100%',
              height: 'fit-content',
              maxWidth: 600,
              position: 'relative'
            }}
          >
            <Typography variant='h6'>Receive partner rewards</Typography>
            <Typography variant='body1'>
              Send {partnerReward.amount} {partnerReward.tokenSymbol} to {partnerReward.recipientAddress}
            </Typography>
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <LoadingButton variant='contained' color='primary' loading={isClaiming} onClick={claimPartnerReward}>
                Claim
              </LoadingButton>
              <Button disabled={isClaiming} color='error' onClick={() => setShowPartnerRewardModal(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Dialog>
      )}
    </>
  );
}
