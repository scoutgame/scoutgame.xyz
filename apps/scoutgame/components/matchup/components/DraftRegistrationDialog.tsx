'use client';

import { log } from '@charmverse/core/log';
import { Box, Typography } from '@mui/material';
import { MATCHUP_REGISTRATION_FEE } from '@packages/matchup/config';
import { registerForMatchupAction } from '@packages/matchup/registerForMatchupAction';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import {
  devTokenContractAddress,
  scoutProtocolChainId,
  devTokenDecimals
} from '@packages/scoutgame/protocol/constants';
import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { usePurchase } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
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
import type { SelectedPaymentOption } from 'components/common/NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import { BlockchainSelect } from 'components/common/NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import { useGetTokenBalances } from 'components/common/NFTPurchaseDialog/hooks/useGetTokenBalances';
// import type { NFTPurchaseProps } from './components/NFTPurchaseForm';
// import { NFTPurchaseForm } from './components/NFTPurchaseForm';

// This component opens the wallet connect modal if the user is not connected yet
function DraftRegistrationDialogComponent() {
  const { refreshUser, user } = useUser();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const { closeModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: scoutProtocolChainId,
    currency: 'DEV'
  });
  const selectedChainCurrency = getCurrencyContract(selectedPaymentOption) as Address;
  const { address } = useAccount();
  const { tokens: userTokenBalances } = useGetTokenBalances({ address: address as Address });

  const balanceInfo = userTokenBalances?.find(
    (_token) => _token.chainId === selectedPaymentOption.chainId && _token.address === selectedChainCurrency
  );
  const hasInsufficientBalance = balanceInfo && balanceInfo.balance < MATCHUP_REGISTRATION_FEE;
  const displayedBalance = !balanceInfo
    ? undefined
    : selectedPaymentOption.currency === 'ETH' || selectedPaymentOption.currency === 'DEV'
      ? (Number(balanceInfo.balance || 0) / 1e18).toFixed(4)
      : (Number(balanceInfo.balance || 0) / 1e6).toFixed(2);

  const { execute, isExecuting } = useAction(registerForMatchupAction, {
    async onSuccess() {
      toast.success('Successfully registered for matchup');
      revalidatePathAction();
      refreshUser();
      closeModal();
    },
    onError(err) {
      toast.error('Error registering for matchup');
      log.error('Error registering for matchup', { error: err });
      closeModal();
    }
  });

  return (
    <Box width='350px' maxWidth='100%' mx='auto'>
      <Box display='flex' alignItems='center' justifyContent='center' py={2} gap={1}>
        <Image src='/images/matchup/vs_icon.svg' alt='' width={50} height={50} />
        <Typography variant='h6' color='secondary'>
          Match Up Registration
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 2 }}>
        <Typography variant='body1'>Registration Fee:</Typography>
        <Typography variant='body1'>250 DEV</Typography>
      </Box>
      <Box>
        <Typography color='secondary'>Select payment</Typography>
        <>
          <BlockchainSelect
            value={selectedPaymentOption}
            balance={displayedBalance}
            address={address}
            onSelectChain={(_paymentOption) => {
              setSelectedPaymentOption(_paymentOption);
            }}
          />
          {hasInsufficientBalance ? (
            <Typography sx={{ mt: 1 }} variant='caption' color='error' align='center'>
              Insufficient balance
            </Typography>
          ) : null}
        </>
      </Box>
    </Box>
  );
}

export function DraftRegistrationDialog(props: ConnectedWalletDialogProps) {
  return (
    <ConnectedWalletDialog open={props.open} onClose={props.onClose} hideCloseButton>
      <DraftRegistrationDialogComponent />
    </ConnectedWalletDialog>
  );
}
