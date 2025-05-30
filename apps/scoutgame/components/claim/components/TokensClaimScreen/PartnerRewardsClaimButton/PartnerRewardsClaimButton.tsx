'use client';

import { Button, Dialog, Stack, Tooltip, Typography } from '@mui/material';
import type { UnclaimedPartnerReward } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { formatEther, type Address } from 'viem';

import { revalidateClaimTokensAction } from 'lib/actions/revalidateClaimTokensAction';

import { useClaimSablierAirdrop, useClaimThirdwebAirdrop } from './useClaimPartnerReward';

import '@rainbow-me/rainbowkit/styles.css';

export function PartnerRewardsClaimButton({
  partnerReward,
  chain
}: {
  partnerReward: UnclaimedPartnerReward;
  chain: string;
}) {
  const [showPartnerRewardModal, setShowPartnerRewardModal] = useState(false);

  return (
    <RainbowKitProvider>
      <PartnerRewardsClaimButtonContent
        partnerReward={partnerReward}
        chain={chain}
        showPartnerRewardModal={showPartnerRewardModal}
        setShowPartnerRewardModal={setShowPartnerRewardModal}
      />
    </RainbowKitProvider>
  );
}

function SablierPartnerRewardsClaimButton({
  partnerReward,
  showPartnerRewardModal,
  setShowPartnerRewardModal,
  chain
}: {
  partnerReward: UnclaimedPartnerReward;
  showPartnerRewardModal: boolean;
  setShowPartnerRewardModal: (show: boolean) => void;
  chain: string;
}) {
  const { executeAsync: revalidateClaimTokens } = useAction(revalidateClaimTokensAction);
  const { claim, isClaiming, isConnected, hasEnoughFee, feeAmount } = useClaimSablierAirdrop({
    payoutContractId: partnerReward.payoutContractId,
    contractAddress: partnerReward.contractAddress as Address,
    rewardChainId: partnerReward.chainId,
    recipientAddress: partnerReward.recipientAddress as Address,
    onSuccess: () => {
      setShowPartnerRewardModal(false);
      revalidateClaimTokens();
    }
  });

  return (
    <>
      <Button
        variant='contained'
        color='primary'
        sx={{ width: 'fit-content' }}
        loading={isClaiming}
        disabled={isClaiming}
        onClick={() => setShowPartnerRewardModal(true)}
      >
        Claim
      </Button>
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
            p: {
              xs: 1.5,
              md: 2.5
            },
            gap: {
              xs: 1,
              md: 1.5
            },
            width: '100%',
            height: 'fit-content',
            maxWidth: 600,
            position: 'relative'
          }}
        >
          <Typography variant='h6'>Claim Your Partner Rewards!</Typography>
          <Typography
            variant='body1'
            sx={{
              wordBreak: 'break-all',
              overflowWrap: 'break-word'
            }}
          >
            Send {partnerReward.amount} {partnerReward.tokenSymbol} to {partnerReward.recipientAddress}
          </Typography>
          <Typography variant='body2'>
            Important: You will be charged a fee of{' '}
            <strong>{feeAmount ? Number(formatEther(feeAmount)).toFixed(10) : '0.00036'} ETH (approximately $1)</strong>{' '}
            for the claim, plus a small Gas Fee using ETH on {chain}.
          </Typography>
          <Stack flexDirection='row' justifyContent='flex-end' alignItems='center' gap={1}>
            <Tooltip title={hasEnoughFee ? '' : 'You do not have enough ETH to claim the airdrop'}>
              <span>
                <Button
                  variant='contained'
                  color='primary'
                  loading={isClaiming}
                  onClick={claim}
                  disabled={!hasEnoughFee}
                >
                  {isConnected ? 'Claim' : 'Connect Wallet'}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant='outlined'
              disabled={isClaiming}
              color='error'
              onClick={() => setShowPartnerRewardModal(false)}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}

function ThirdwebPartnerRewardsClaimButton({
  partnerReward,
  showPartnerRewardModal,
  setShowPartnerRewardModal
}: {
  partnerReward: UnclaimedPartnerReward;
  showPartnerRewardModal: boolean;
  setShowPartnerRewardModal: (show: boolean) => void;
}) {
  const { executeAsync: revalidateClaimTokens } = useAction(revalidateClaimTokensAction);
  const { claim, isClaiming, isConnected } = useClaimThirdwebAirdrop({
    payoutContractId: partnerReward.payoutContractId,
    contractAddress: partnerReward.contractAddress as Address,
    rewardChainId: partnerReward.chainId,
    recipientAddress: partnerReward.recipientAddress as Address,
    onSuccess: () => {
      setShowPartnerRewardModal(false);
      revalidateClaimTokens();
    }
  });

  return (
    <>
      <Button
        variant='contained'
        color='primary'
        sx={{ width: 'fit-content' }}
        loading={isClaiming}
        disabled={isClaiming}
        onClick={() => setShowPartnerRewardModal(true)}
      >
        Claim
      </Button>
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
            p: {
              xs: 1.5,
              md: 2.5
            },
            gap: {
              xs: 1,
              md: 1.5
            },
            width: '100%',
            height: 'fit-content',
            maxWidth: 600,
            position: 'relative'
          }}
        >
          <Typography variant='h6'>Claim Your Partner Rewards!</Typography>
          <Typography
            variant='body1'
            sx={{
              wordBreak: 'break-all',
              overflowWrap: 'break-word'
            }}
          >
            Send {partnerReward.amount} {partnerReward.tokenSymbol} to {partnerReward.recipientAddress}
          </Typography>

          <Stack flexDirection='row' justifyContent='flex-end' alignItems='center' gap={1}>
            <span>
              <Button variant='contained' color='primary' loading={isClaiming} onClick={claim}>
                {isConnected ? 'Claim' : 'Connect Wallet'}
              </Button>
            </span>
            <Button
              variant='outlined'
              disabled={isClaiming}
              color='error'
              onClick={() => setShowPartnerRewardModal(false)}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}

function PartnerRewardsClaimButtonContent({
  partnerReward,
  showPartnerRewardModal,
  setShowPartnerRewardModal,
  chain
}: {
  partnerReward: UnclaimedPartnerReward;
  showPartnerRewardModal: boolean;
  setShowPartnerRewardModal: (show: boolean) => void;
  chain: string;
}) {
  if (partnerReward.provider === 'sablier') {
    return (
      <SablierPartnerRewardsClaimButton
        partnerReward={partnerReward}
        showPartnerRewardModal={showPartnerRewardModal}
        setShowPartnerRewardModal={setShowPartnerRewardModal}
        chain={chain}
      />
    );
  }

  return (
    <ThirdwebPartnerRewardsClaimButton
      partnerReward={partnerReward}
      showPartnerRewardModal={showPartnerRewardModal}
      setShowPartnerRewardModal={setShowPartnerRewardModal}
    />
  );
}
