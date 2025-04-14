'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { LoadingButton } from '@mui/lab';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { DraftProvider, useDraft } from '@packages/scoutgame-ui/providers/DraftProvider';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { useDecentTransaction } from '../hooks/useDecentTransaction';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';
import { WalletLogin } from '../WalletLogin';

import type { AvailableCurrency, SelectedPaymentOption } from './DraftPaymentOptionSelector';
import {
  BASE_USDC_ADDRESS,
  DEV_PAYMENT_OPTION,
  DEV_TOKEN_ADDRESS,
  DraftPaymentOptionSelector,
  OPTIMISM_USDC_ADDRESS,
  TOKEN_LOGO_RECORD
} from './DraftPaymentOptionSelector';

// Placeholder for bid recipient wallet - will be replaced with actual address
const MIN_BID_DEV = 0.01; // Minimum bid is 100 DEV tokens

export function DraftDeveloperBidForm({ onCancel, developerId }: { onCancel: () => void; developerId: string }) {
  const { address } = useAccount();

  if (!address) {
    return <WalletLogin />;
  }

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <DraftProvider>
        <DraftDeveloperBidFormComponent address={address} onCancel={onCancel} developerId={developerId} />
      </DraftProvider>
    </BoxHooksContextProvider>
  );
}

function DraftDeveloperBidFormComponent({
  address,
  onCancel,
  developerId
}: {
  address: Address;
  onCancel: () => void;
  developerId: string;
}) {
  const [bidAmount, setBidAmount] = useState(0);
  const [customError, setCustomError] = useState<string | null>(null);
  const trackEvent = useTrackEvent();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendDraftTransaction, isSavingDraftTransaction, draftSuccess, draftError } = useDraft();

  // Default to Base ETH
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>(() => ({
    chainId: DEV_PAYMENT_OPTION.chain.id,
    address: DEV_PAYMENT_OPTION.address,
    currency: DEV_PAYMENT_OPTION.currency,
    decimals: DEV_PAYMENT_OPTION.decimals
  }));

  // Fetch ETH and LINK prices from CoinGecko
  const { data: prices, isLoading: isLoadingPrices } = useSWR('token-prices', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,chainlink&vs_currencies=usd'
    );
    const data = await response.json();
    return {
      eth: data.ethereum.usd as number,
      dev: data.chainlink.usd as number
    };
  });

  const { tokens, isLoading: isLoadingTokenBalances } = useGetTokenBalances({
    address
  });

  const { selectedTokenBalance, tokensWithBalances } = useMemo(() => {
    const _tokensWithBalances = tokens?.map((token) => ({
      ...token,
      balance: Number(token.balance) / 10 ** token.decimals
    }));

    const _selectedPaymentOption = _tokensWithBalances?.find(
      (token) =>
        token.chainId === selectedPaymentOption.chainId &&
        (selectedPaymentOption.currency === 'ETH'
          ? token.address === NULL_EVM_ADDRESS
          : selectedPaymentOption.currency === 'DEV'
            ? token.address?.toLowerCase() === DEV_TOKEN_ADDRESS.toLowerCase()
            : token.address?.toLowerCase() ===
              (selectedPaymentOption.chainId === base.id ? BASE_USDC_ADDRESS : OPTIMISM_USDC_ADDRESS).toLowerCase())
    );

    return {
      tokensWithBalances: _tokensWithBalances,
      selectedTokenBalance: _selectedPaymentOption?.balance
    };
  }, [tokens, selectedPaymentOption]);

  // Calculate minimum bid based on currency
  const getMinBid = useCallback(
    (currency: AvailableCurrency) => {
      switch (currency) {
        case 'USDC':
          return prices?.dev ? MIN_BID_DEV * prices.dev : undefined;
        case 'ETH':
          return prices?.eth && prices?.dev ? (MIN_BID_DEV * prices.dev) / prices.eth : undefined;
        case 'DEV':
          return MIN_BID_DEV; // Fixed 100 DEV tokens
        default:
          return undefined;
      }
    },
    [prices]
  );

  const minimumBid = getMinBid(selectedPaymentOption.currency);

  // Validate bid amount whenever it changes
  useEffect(() => {
    if (minimumBid === undefined || selectedTokenBalance === undefined) {
      setCustomError(null);
      return;
    }

    if (selectedTokenBalance < minimumBid) {
      setCustomError('Insufficient balance');
      return;
    }

    if (bidAmount < minimumBid) {
      setCustomError(`Minimum bid is ${minimumBid?.toFixed(selectedPaymentOption.currency === 'ETH' ? 8 : 4)}`);
      return;
    }

    setCustomError(null);
  }, [bidAmount, prices?.eth, selectedPaymentOption.currency, minimumBid, selectedTokenBalance]);

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentTransaction({
    address,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    paymentAmountOut: BigInt(bidAmount * 10 ** selectedPaymentOption.decimals)
  });

  const handleSubmit = async () => {
    if (!decentTransactionInfo?.tx) {
      return;
    }

    try {
      // Switch chain if needed
      if (chainId !== selectedPaymentOption.chainId) {
        await switchChainAsync(
          { chainId: selectedPaymentOption.chainId },
          {
            onError() {
              setCustomError('Failed to switch chain');
            }
          }
        );
      }

      const _value = BigInt(String((decentTransactionInfo.tx as any).value || 0).replace('n', ''));

      await sendDraftTransaction({
        txData: {
          to: decentTransactionInfo.tx.to as Address,
          data: decentTransactionInfo.tx.data as any,
          value: _value
        },
        txMetadata: {
          fromAddress: address,
          sourceChainId: selectedPaymentOption.chainId,
          developerId,
          bidAmount,
          season: getCurrentSeasonStart()
        }
      });

      if (draftSuccess) {
        onCancel();
      }

      trackEvent('draft_developer', {
        amount: bidAmount,
        developerId,
        chainId: selectedPaymentOption.chainId,
        currency: selectedPaymentOption.currency
      });
    } catch (error) {
      log.error('Error submitting bid:', error);
      setCustomError('Failed to submit bid. Please try again.');
    }
  };

  const isLoading = isLoadingPrices || isLoadingTokenBalances || isLoadingDecentSdk || isSavingDraftTransaction;

  return (
    <Stack gap={1}>
      <DraftPaymentOptionSelector
        selectedPaymentOption={selectedPaymentOption}
        address={address}
        onSelectPaymentOption={setSelectedPaymentOption}
        prices={prices}
        minimumBid={minimumBid}
        selectedTokenBalance={selectedTokenBalance}
        disabled={isLoading}
        tokensWithBalances={tokensWithBalances}
      />
      <Stack gap={1}>
        <Typography color='text.secondary' fontWeight={500}>
          Your Bid
        </Typography>
        <TextField
          fullWidth
          value={bidAmount}
          type='number'
          disabled={isLoading}
          onChange={(e) => {
            if (e.target.value === '') {
              setBidAmount(0);
              return;
            }

            const parsedBidAmount = Math.max(0, parseFloat(e.target.value));
            setBidAmount(
              selectedTokenBalance !== undefined ? Math.min(parsedBidAmount, selectedTokenBalance) : parsedBidAmount
            );
          }}
          error={!!customError || !!draftError}
          helperText={customError || draftError}
          InputProps={{
            endAdornment: (
              <Image
                src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
                alt={selectedPaymentOption.currency}
                width={20}
                height={20}
              />
            )
          }}
        />
      </Stack>
      {decentSdkError && (
        <Typography variant='caption' color='error' align='center'>
          There was an error communicating with Decent API
        </Typography>
      )}
      <Stack direction='row' justifyContent='flex-end' alignItems='center' gap={1} mt={1}>
        <Button onClick={onCancel} variant='outlined' color='secondary' size='large' disabled={isLoading}>
          Cancel
        </Button>
        <LoadingButton
          loading={isLoading}
          onClick={handleSubmit}
          variant='contained'
          color='secondary'
          size='large'
          disabled={!!customError || !decentTransactionInfo?.tx || !!draftError}
        >
          Confirm
        </LoadingButton>
      </Stack>
    </Stack>
  );
}
