'use client';

import { log } from '@charmverse/core/log';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DRAFT_BID_RECIPIENT_ADDRESS } from '@packages/blockchain/constants';
import { MATCHUP_REGISTRATION_FEE } from '@packages/matchup/config';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { DevTokenIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useMatchup } from '@packages/scoutgame-ui/providers/MatchupProvider';
import { usePurchase } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'ethers/utils';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

import type { ConnectedWalletDialogProps } from 'components/common/ConnectedWalletDialog';
import { ConnectedWalletDialog } from 'components/common/ConnectedWalletDialog';
import { useGlobalModal } from 'components/common/ModalProvider';
import { getCurrencyContract } from 'components/common/NFTPurchaseDialog/components/ChainSelector/chains';
import { BlockchainSelect } from 'components/common/NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import { DEV_PAYMENT_OPTION, PaymentTokenSelector, TOKEN_LOGO_RECORD } from 'components/common/PaymentTokenSelector';
import type { SelectedPaymentOption } from 'components/common/PaymentTokenSelector';
import { useGetTokenBalances } from 'hooks/useGetTokenBalances';

import { useTokenPayment } from './hooks/useTokenPayment';
// import type { NFTPurchaseProps } from './components/NFTPurchaseForm';
// import { NFTPurchaseForm } from './components/NFTPurchaseForm';

function MatchupRegistrationForm({ week }: { week: string }) {
  const { refreshUser } = useUser();
  const { closeModal } = useGlobalModal();
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    ...DEV_PAYMENT_OPTION
  });
  const { address } = useAccount();
  const { tokens: userTokenBalances } = useGetTokenBalances({ address: address as Address });

  const selectedTokenBalance = userTokenBalances?.find(
    (token) =>
      token.address.toLowerCase() === selectedPaymentOption.address.toLowerCase() &&
      token.chainId === selectedPaymentOption.chainId
  )?.balance;

  // prepare the transaction
  const { isLoading, sourceTokenAmount, approvalRequired, decentTransactionInfo } = useTokenPayment({
    paymentOption: selectedPaymentOption,
    devTokenAmount: MATCHUP_REGISTRATION_FEE,
    hasTokenBalance: !!selectedTokenBalance,
    toAddress: DRAFT_BID_RECIPIENT_ADDRESS
  });

  const hasInsufficientBalance = Boolean(selectedTokenBalance && selectedTokenBalance < MATCHUP_REGISTRATION_FEE);

  const [isConfirmingTx, setIsConfirmingTx] = useState(false);

  const { sendTransactionViaDecent, isSaving, sendDirectTransaction } = useMatchup();

  async function handleSubmit() {
    setIsConfirmingTx(true);
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!sourceTokenAmount) {
      toast.error('Insufficient balance');
      return;
    }
    try {
      // Calculate bid amount in DEV tokens
      if (selectedPaymentOption.currency === 'DEV') {
        await sendDirectTransaction({
          tokenAmount: parseUnits(sourceTokenAmount.toString(), devTokenDecimals),
          fromAddress: address,
          toAddress: DRAFT_BID_RECIPIENT_ADDRESS,
          tokenAddress: selectedPaymentOption.address,
          matchupWeek: week
        });
      } else if (decentTransactionInfo && 'tx' in decentTransactionInfo) {
        await sendTransactionViaDecent({
          matchupWeek: week,
          txData: {
            to: decentTransactionInfo.tx.to as Address,
            data: decentTransactionInfo.tx.data as any,
            value: BigInt((decentTransactionInfo.tx as EvmTransaction).value?.toString().replace('n', '') || '0')
          },
          txMetadata: {
            fromAddress: address,
            sourceChainId: selectedPaymentOption.chainId,
            sourceToken: selectedPaymentOption.address
          }
        });
      }
    } catch (error) {
      log.error('Error submitting payment:', { error, address });
      if ((error as Error).message.includes('rejected')) {
        toast.error('Transaction rejected');
      } else {
        throw error;
      }
    } finally {
      setIsConfirmingTx(false);
    }
  }
  async function registerForMatchup() {
    if (approvalRequired) {
      toast.error('Please approve the token transfer');
      return;
    }
    try {
      await handleSubmit();
      toast.success('Successfully registered for matchup');
      revalidatePathAction();
      refreshUser();
      closeModal();
    } catch (error) {
      toast.error('Error registering for matchup');
      log.error('Error registering for matchup', { error });
    }
  }

  return (
    <Box width='350px' maxWidth='100%' mx='auto'>
      <Box display='flex' alignItems='center' justifyContent='center' py={2} gap={1}>
        <Image src='/images/matchup/vs_icon.svg' alt='' width={50} height={50} />
        <Typography variant='h6' color='secondary' fontWeight={600}>
          Match Up Registration
        </Typography>
      </Box>
      <Box display='flex' justifyContent='space-between' width='100%' mb={2}>
        <Typography variant='body1'>Registration Fee:</Typography>
        <Typography variant='body1' display='flex' alignItems='center' gap={1}>
          {MATCHUP_REGISTRATION_FEE} <DevTokenIcon />
        </Typography>
      </Box>
      <Box mb={1}>
        <PaymentTokenSelector
          selectedPaymentOption={selectedPaymentOption}
          onSelectPaymentOption={(option) => {
            setSelectedPaymentOption(option);
          }}
          selectedTokenBalance={selectedTokenBalance}
          disabled={isLoading}
          tokensWithBalances={userTokenBalances}
        />
        {hasInsufficientBalance ? (
          <Typography sx={{ mt: 1 }} variant='caption' color='error' align='center'>
            Insufficient balance
          </Typography>
        ) : null}
      </Box>
      <Stack gap={0.5} alignItems='center' flexDirection='row' mb={2}>
        <Typography align='center'>You will be charged {sourceTokenAmount}</Typography>
        <Image
          src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
          alt={selectedPaymentOption.currency}
          width={16}
          height={16}
        />
      </Stack>
      <Stack direction='row' spacing={2} justifyContent='flex-end'>
        <Button variant='outlined' color='secondary' onClick={closeModal}>
          Cancel
        </Button>
        <Button
          loading={isLoading || isConfirmingTx || isSaving}
          onClick={registerForMatchup}
          disabled={hasInsufficientBalance}
          color='primary'
          variant='contained'
        >
          Pay
        </Button>
      </Stack>
    </Box>
  );
}

export function MatchupRegistrationDialog({ week, open, onClose }: ConnectedWalletDialogProps & { week: string }) {
  return (
    <ConnectedWalletDialog open={open} onClose={onClose} hideCloseButton>
      <MatchupRegistrationForm week={week} />
    </ConnectedWalletDialog>
  );
}
