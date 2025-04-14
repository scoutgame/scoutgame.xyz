'use client';

import env from '@beam-australia/react-env';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';
import { useAccount } from 'wagmi';

import { BlockchainSelect } from '../NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import type { SelectedPaymentOption } from '../NFTPurchaseDialog/components/ChainSelector/ChainSelector';
import { useGetTokenBalances } from '../NFTPurchaseDialog/hooks/useGetTokenBalances';

import { DraftTokenSelector } from './components/DraftTokenSelector';
import { WalletLogin } from './WalletLogin';

// Placeholder for bid recipient wallet - will be replaced with actual address
const BID_RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000000';
const MIN_BID_USD = 2;

const OPTIMISM_USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export function DraftBid({ onCancel }: { onCancel: () => void }) {
  const { address } = useAccount();

  if (!address) {
    return <WalletLogin />;
  }

  return <DraftBidComponent address={address} onCancel={onCancel} />;
}

function DraftBidComponent({ address, onCancel }: { address: Address; onCancel: () => void }) {
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Default to Base ETH
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: base.id,
    currency: 'USDC'
  });

  // Fetch ETH price from CoinGecko
  const { data: ethPrice, error: ethPriceError } = useSWR('eth-price', async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd as number;
  });

  const { tokens: userTokenBalances } = useGetTokenBalances({ address });

  // Get balance for selected token
  const selectedTokenBalance = userTokenBalances?.find(
    (token) =>
      token.chainId === selectedPaymentOption.chainId &&
      (selectedPaymentOption.currency === 'ETH'
        ? token.address === '0x0000000000000000000000000000000000000000'
        : token.address?.toLowerCase() ===
          (selectedPaymentOption.chainId === base.id ? BASE_USDC_ADDRESS : OPTIMISM_USDC_ADDRESS))
  );

  const displayedBalance = !selectedTokenBalance
    ? undefined
    : selectedPaymentOption.currency === 'ETH'
      ? (Number(selectedTokenBalance.balance) / 1e18).toFixed(4)
      : (Number(selectedTokenBalance.balance) / 1e6).toFixed(2);

  // Validate bid amount whenever it changes
  useEffect(() => {
    if (!bidAmount) {
      setError(null);
      return;
    }

    const numericBid = parseFloat(bidAmount);
    if (Number.isNaN(numericBid)) {
      setError('Please enter a valid number');
      return;
    }

    if (selectedPaymentOption.currency === 'USDC') {
      if (numericBid < MIN_BID_USD) {
        setError(`Minimum bid is $${MIN_BID_USD}`);
        return;
      }
    } else if (ethPrice) {
      const bidInUsd = numericBid * ethPrice;
      if (bidInUsd < MIN_BID_USD) {
        setError(`Minimum bid is ${(MIN_BID_USD / ethPrice).toFixed(6)} ETH ($${MIN_BID_USD})`);
        return;
      }
    }

    // Check balance
    if (displayedBalance && numericBid > parseFloat(displayedBalance)) {
      setError('Insufficient balance');
      return;
    }

    setError(null);
  }, [bidAmount, ethPrice, selectedPaymentOption.currency, displayedBalance]);

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <Stack gap={2}>
        <DraftTokenSelector
          selectedToken={selectedPaymentOption}
          address={address}
          onSelectChain={setSelectedPaymentOption}
        />
        <Stack gap={1}>
          <Typography color='text.secondary' fontWeight={500}>
            Your Bid
          </Typography>
          <TextField
            fullWidth
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            error={!!error}
            helperText={error}
            InputProps={{
              endAdornment: (
                <Box component='span' sx={{ color: 'text.secondary', ml: 1 }}>
                  {selectedPaymentOption.currency}
                </Box>
              )
            }}
          />
        </Stack>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Button onClick={onCancel} variant='outlined' color='primary'>
            Cancel
          </Button>
          <Button variant='contained' color='primary'>
            Confirm
          </Button>
        </Stack>
      </Stack>
    </BoxHooksContextProvider>
  );
}
