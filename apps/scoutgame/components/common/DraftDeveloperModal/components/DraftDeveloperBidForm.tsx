'use client';

import env from '@beam-australia/react-env';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

import type { AvailableCurrency } from '../../NFTPurchaseDialog/components/ChainSelector/chains';
import type { SelectedPaymentOption } from '../../NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import { useGetTokenBalances } from '../../NFTPurchaseDialog/hooks/useGetTokenBalances';
import { WalletLogin } from '../WalletLogin';

import {
  BASE_USDC_ADDRESS,
  DEV_TOKEN_ADDRESS,
  DraftPaymentOptionSelector,
  OPTIMISM_USDC_ADDRESS,
  TOKEN_LOGO_RECORD
} from './DraftPaymentOptionSelector';

// Placeholder for bid recipient wallet - will be replaced with actual address
const BID_RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000000';
// TODO: Change to 100 DEV on prod
const MIN_BID_DEV = 0.01;

export function DraftDeveloperBidForm({ onCancel }: { onCancel: () => void }) {
  const { address } = useAccount();

  if (!address) {
    return <WalletLogin />;
  }

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <DraftDeveloperBidFormComponent address={address} onCancel={onCancel} />
    </BoxHooksContextProvider>
  );
}

function DraftDeveloperBidFormComponent({ address, onCancel }: { address: Address; onCancel: () => void }) {
  const [bidAmount, setBidAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Default to Base ETH
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: base.id,
    currency: 'USDC'
  });

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

  const { selectedTokenBalance } = useMemo(() => {
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
      setError(null);
      return;
    }

    if (selectedTokenBalance < minimumBid) {
      setError('Insufficient balance');
      return;
    }

    if (bidAmount < minimumBid) {
      setError(`Minimum bid is ${minimumBid?.toFixed(selectedPaymentOption.currency === 'ETH' ? 8 : 4)}`);
      return;
    }

    setError(null);
  }, [bidAmount, prices?.eth, selectedPaymentOption.currency, minimumBid, selectedTokenBalance]);

  return (
    <Stack gap={1}>
      <DraftPaymentOptionSelector
        selectedPaymentOption={selectedPaymentOption}
        address={address}
        onSelectPaymentOption={setSelectedPaymentOption}
        prices={prices}
        minimumBid={minimumBid}
        selectedTokenBalance={selectedTokenBalance}
        disabled={isLoadingPrices || isLoadingTokenBalances}
      />
      <Stack gap={1}>
        <Typography color='text.secondary' fontWeight={500}>
          Your Bid
        </Typography>
        <TextField
          fullWidth
          value={bidAmount}
          type='number'
          disabled={isLoadingPrices || isLoadingTokenBalances}
          onChange={(e) => {
            if (e.target.value === '') {
              setBidAmount(0);
              return;
            }

            const parsedBidAmount = Math.max(0, parseFloat(e.target.value));
            setBidAmount(parsedBidAmount);
          }}
          error={!!error}
          helperText={error}
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
      <Stack direction='row' justifyContent='flex-end' alignItems='center' gap={1} mt={1}>
        <Button onClick={onCancel} variant='outlined' color='secondary' size='large'>
          Cancel
        </Button>
        <Button variant='contained' color='secondary' size='large' disabled={!!error}>
          Confirm
        </Button>
      </Stack>
    </Stack>
  );
}
