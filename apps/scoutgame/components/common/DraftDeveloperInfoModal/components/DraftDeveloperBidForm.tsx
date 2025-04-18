'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { LoadingButton } from '@mui/lab';
import { Button, Stack, TextField, Typography } from '@mui/material';
import {
  BASE_USDC_ADDRESS,
  DEV_TOKEN_ADDRESS,
  MIN_DEV_BID,
  NULL_EVM_ADDRESS,
  OPTIMISM_USDC_ADDRESS
} from '@packages/blockchain/constants';
import { WalletLogin } from '@packages/scoutgame-ui/components/common/WalletLogin/WalletLogin';
import { useUserWalletAddress } from '@packages/scoutgame-ui/hooks/api/session';
import { useDebouncedValue } from '@packages/scoutgame-ui/hooks/useDebouncedValue';
import { useDraft } from '@packages/scoutgame-ui/providers/DraftProvider';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { ERC20ApproveButton } from '../../NFTPurchaseDialog/components/ERC20Approve';
import { useGetERC20Allowance } from '../../NFTPurchaseDialog/hooks/useGetERC20Allowance';
import { useDecentV4Transaction } from '../hooks/useDecentV4Transaction';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';

import type { AvailableCurrency, SelectedPaymentOption } from './DraftPaymentOptionSelector';
import { DEV_PAYMENT_OPTION, DraftPaymentOptionSelector, TOKEN_LOGO_RECORD } from './DraftPaymentOptionSelector';

export function DraftDeveloperBidForm({ onCancel, developerId }: { onCancel: () => void; developerId: string }) {
  const { address } = useAccount();

  if (!address) {
    return <WalletLogin color='secondary' />;
  }

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <DraftDeveloperBidFormComponent address={address} onCancel={onCancel} developerId={developerId} />
    </BoxHooksContextProvider>
  );
}

const ceilToPrecision = (value: number, precision: number) => {
  const multiplier = 10 ** precision;
  return Math.ceil(value * multiplier) / multiplier;
};

function DraftDeveloperBidFormComponent({
  address,
  onCancel,
  developerId
}: {
  address: Address;
  onCancel: () => void;
  developerId: string;
}) {
  const [bidAmount, setBidAmount] = useState('0');
  const debouncedBidAmount = useDebouncedValue(bidAmount, 500);
  const [customError, setCustomError] = useState<string | null>(null);
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendDraftTransaction, isSavingDraftTransaction, draftError, sendDevTransaction } = useDraft();
  const { error: addressError } = useUserWalletAddress(address);

  // Default to Base ETH
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>(() => ({
    chainId: DEV_PAYMENT_OPTION.chain.id,
    address: DEV_PAYMENT_OPTION.address,
    currency: DEV_PAYMENT_OPTION.currency,
    decimals: DEV_PAYMENT_OPTION.decimals
  }));

  // Fetch ETH and TALENT prices from CoinGecko
  const { data: prices, isLoading: isLoadingPrices } = useSWR('token-prices', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,talent-protocol&vs_currencies=usd'
    );
    const data = await response.json();
    return {
      eth: data.ethereum.usd as number,
      dev: data['talent-protocol'].usd as number
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
          return prices?.dev ? ceilToPrecision(MIN_DEV_BID * prices.dev, 2) : undefined;
        case 'ETH':
          return prices?.eth && prices?.dev ? ceilToPrecision((MIN_DEV_BID * prices.dev) / prices.eth, 5) : undefined;
        case 'DEV':
          return MIN_DEV_BID; // Fixed 100 DEV tokens
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

    const numericBidAmount = Number(debouncedBidAmount);

    if (selectedTokenBalance < minimumBid) {
      setCustomError(`Insufficient balance for minimum bid.`);
      return;
    }

    if (selectedTokenBalance < numericBidAmount) {
      setCustomError(`Insufficient balance in your wallet for this bid.`);
      return;
    }

    if (numericBidAmount < minimumBid) {
      setCustomError(`Minimum bid is ${minimumBid}`);
      return;
    }

    setCustomError(null);
  }, [
    debouncedBidAmount,
    prices?.eth,
    selectedPaymentOption.currency,
    minimumBid,
    selectedTokenBalance,
    selectedPaymentOption.decimals
  ]);

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentV4Transaction({
    address,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    enabled: !!(
      selectedPaymentOption.currency !== 'DEV' &&
      minimumBid &&
      selectedTokenBalance &&
      parseFloat(debouncedBidAmount) >= minimumBid
    ),
    paymentAmountIn: parseUnits(debouncedBidAmount, selectedPaymentOption.decimals)
  });

  const selectedChainCurrency = selectedPaymentOption.address;

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address:
      selectedPaymentOption.currency === 'USDC' || selectedPaymentOption.currency === 'DEV'
        ? selectedChainCurrency
        : null,
    owner: address,
    spender: decentTransactionInfo && 'tx' in decentTransactionInfo ? decentTransactionInfo.tx.to : null
  });

  const amountToPay = BigInt(parseUnits(debouncedBidAmount, selectedPaymentOption.decimals));

  const approvalRequired =
    selectedPaymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToPay === 'bigint' ? amountToPay : BigInt(0));

  const handleSubmit = async () => {
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

      // Calculate bid amount in DEV tokens
      const numericBidAmount = Number(bidAmount);
      let bidAmountInDev = numericBidAmount;

      if (selectedPaymentOption.currency === 'DEV') {
        await sendDevTransaction({
          developerId,
          bidAmountInDev: parseUnits(bidAmountInDev.toFixed(18), 18),
          fromAddress: address
        });
      } else if (decentTransactionInfo && 'tx' in decentTransactionInfo) {
        if (selectedPaymentOption.currency === 'ETH' && prices?.eth && prices?.dev) {
          bidAmountInDev = (numericBidAmount * prices.eth) / prices.dev;
        } else if (selectedPaymentOption.currency === 'USDC' && prices?.dev) {
          bidAmountInDev = numericBidAmount / prices.dev;
        }

        await sendDraftTransaction({
          txData: {
            to: decentTransactionInfo.tx.to as Address,
            data: decentTransactionInfo.tx.data as any,
            value: BigInt((decentTransactionInfo.tx as EvmTransaction).value?.toString().replace('n', '') || '0')
          },
          txMetadata: {
            fromAddress: address,
            sourceChainId: selectedPaymentOption.chainId,
            developerId,
            bidAmount: parseUnits(debouncedBidAmount, selectedPaymentOption.decimals),
            bidAmountInDev: parseUnits(bidAmountInDev.toFixed(18), 18) // Store DEV amount with 18 decimals
          }
        });
      }

      onCancel();
    } catch (error) {
      log.error('Error submitting bid:', { error, address, developerId });
      setCustomError('Failed to submit bid. Please try again.');
    }
  };

  const isLoading =
    isLoadingPrices ||
    isLoadingTokenBalances ||
    (selectedPaymentOption.currency !== 'DEV' && isLoadingDecentSdk) ||
    isSavingDraftTransaction;

  return (
    <Stack gap={1}>
      <DraftPaymentOptionSelector
        selectedPaymentOption={selectedPaymentOption}
        address={address}
        onSelectPaymentOption={(option) => {
          setBidAmount('0');
          setSelectedPaymentOption(option);
        }}
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
        <Stack direction='row' alignItems='center' gap={1}>
          <Stack direction='row' alignItems='center' gap={0.5}>
            <Typography variant='body2'>Min Bid: {MIN_DEV_BID}</Typography>
            <Image src={TOKEN_LOGO_RECORD.DEV} alt='DEV' width={16} height={16} />
          </Stack>
          {selectedPaymentOption.currency !== 'DEV' ? (
            <>
              <Typography variant='body2'>or</Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='body2'>{minimumBid ?? '0'}</Typography>
                <Image
                  src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
                  alt={selectedPaymentOption.currency}
                  width={16}
                  height={16}
                />
              </Stack>
            </>
          ) : null}
        </Stack>
        <TextField
          fullWidth
          value={bidAmount}
          type='number'
          disabled={isLoading}
          sx={{
            // Remove the up and down arrows from the number input
            '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0
            }
          }}
          onChange={(e) => {
            if (e.target.value === '') {
              setBidAmount('0');
              return;
            }

            // Keep the raw string value to maintain decimal places
            const rawValue = e.target.value;
            const numericValue = Number(rawValue);

            if (Number.isNaN(numericValue) || numericValue < 0) {
              setBidAmount('0');
              return;
            }

            setBidAmount(rawValue);
          }}
          error={!!customError || !!draftError}
          helperText={customError || draftError}
          InputProps={{
            inputProps: {
              min: 0,
              max: selectedTokenBalance,
              step:
                selectedPaymentOption.currency === 'ETH' ? 0.0001 : selectedPaymentOption.currency === 'USDC' ? 0.1 : 10
            },
            startAdornment: (
              <Image
                src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
                alt={selectedPaymentOption.currency}
                width={20}
                style={{ marginRight: 4 }}
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
      {addressError && (
        <Typography variant='caption' color='error' align='center' data-test='address-error'>
          {'message' in addressError
            ? addressError.message
            : `Address ${address} is already in use. Please connect a different wallet`}
        </Typography>
      )}
      {decentTransactionInfo && 'error' in decentTransactionInfo && bidAmount !== '0' && (
        <Typography variant='caption' color='error' align='center'>
          {decentTransactionInfo.error.message}
        </Typography>
      )}
      {!approvalRequired || isSavingDraftTransaction ? (
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
            disabled={
              !!customError ||
              (selectedPaymentOption.currency !== 'DEV' &&
                (!decentTransactionInfo || !('tx' in decentTransactionInfo) || 'error' in decentTransactionInfo)) ||
              !!draftError ||
              !!addressError
            }
          >
            Confirm
          </LoadingButton>
        </Stack>
      ) : decentTransactionInfo && 'tx' in decentTransactionInfo ? (
        <ERC20ApproveButton
          spender={decentTransactionInfo?.tx.to as Address}
          chainId={selectedPaymentOption.chainId}
          erc20Address={selectedPaymentOption.address}
          amount={amountToPay}
          onSuccess={() => refreshAllowance()}
          decimals={selectedPaymentOption.decimals}
          currency={selectedPaymentOption.currency}
          actionType='bid'
          color='secondary'
        />
      ) : null}
    </Stack>
  );
}
