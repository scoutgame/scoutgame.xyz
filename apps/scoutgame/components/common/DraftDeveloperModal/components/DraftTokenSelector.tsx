'use client';

import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';

import { ChainComponent } from '../../NFTPurchaseDialog/components/ChainSelector/ChainComponent';
import type { AvailableCurrency } from '../../NFTPurchaseDialog/components/ChainSelector/chains';
import { useGetTokenBalances } from '../../NFTPurchaseDialog/hooks/useGetTokenBalances';

export type SelectedPaymentOption = { chainId: number; currency: AvailableCurrency };

const MIN_BID_DEV = 0.01; // Minimum bid is 100 DEV tokens

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency;
}

// LINK token address on Base (placeholder for DEV token)
// TODO: Replace with DEV token address once its launched
const DEV_TOKEN_ADDRESS = '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196';
const OPTIMISM_USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const optimismChainOption = {
  name: 'Optimism',
  id: optimism.id,
  icon: '/images/crypto/op.png',
  chain: optimism,
  usdcAddress: OPTIMISM_USDC_ADDRESS
};

const baseChainOption = {
  name: 'Base',
  id: base.id,
  icon: '/images/crypto/base64.png',
  chain: base,
  usdcAddress: BASE_USDC_ADDRESS
};

const TOKEN_LOGO_RECORD = {
  ETH: '/images/crypto/ethereum-eth-logo.png',
  USDC: '/images/crypto/usdc.png',
  DEV: '/images/crypto/dev-token-logo.png'
};

const chainOpts = [
  {
    ...baseChainOption,
    currency: 'DEV' as const
  },
  {
    ...baseChainOption,
    currency: 'ETH' as const
  },
  {
    ...baseChainOption,
    currency: 'USDC' as const
  },
  {
    ...optimismChainOption,
    currency: 'ETH' as const
  },
  {
    ...optimismChainOption,
    currency: 'USDC' as const
  }
];

function SelectField(
  {
    onSelectChain,
    selectedToken,
    address,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectChain: (opt: SelectedPaymentOption) => void;
    selectedToken: SelectedPaymentOption;
    address: Address;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  // Fetch ETH and LINK prices from CoinGecko
  const { data: prices } = useSWR('token-prices', async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,chainlink&vs_currencies=usd'
    );
    const data = await response.json();
    return {
      eth: data.ethereum.usd as number,
      dev: data.chainlink.usd as number
    };
  });

  const { tokens } = useGetTokenBalances({
    address
  });

  const { tokensWithBalances, selectedTokenBalance, displayedBalance } = useMemo(() => {
    const _tokensWithBalances = tokens?.map((token) => ({
      ...token,
      balance: Number(token.balance) / 10 ** token.decimals
    }));

    const _selectedTokenBalance = _tokensWithBalances?.find(
      (token) =>
        token.chainId === selectedToken.chainId &&
        (selectedToken.currency === 'ETH'
          ? token.address === NULL_EVM_ADDRESS
          : selectedToken.currency === 'DEV'
            ? token.address?.toLowerCase() === DEV_TOKEN_ADDRESS.toLowerCase()
            : token.address?.toLowerCase() ===
              (selectedToken.chainId === base.id ? BASE_USDC_ADDRESS : OPTIMISM_USDC_ADDRESS).toLowerCase())
    );

    return {
      displayedBalance: _selectedTokenBalance?.balance,
      tokensWithBalances: _tokensWithBalances,
      selectedTokenBalance: _selectedTokenBalance
    };
  }, [tokens, selectedToken]);

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

  const minimumBid = getMinBid(selectedToken.currency);

  return (
    <Stack gap={1} my={1}>
      <Typography color='secondary' fontWeight={500}>
        Select Tokens
      </Typography>
      <Box>
        <Select<SelectedPaymentOption>
          fullWidth
          displayEmpty
          MenuProps={{
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'center'
            },
            transformOrigin: {
              vertical: 'bottom',
              horizontal: 'center'
            }
          }}
          renderValue={(selected) => {
            const chain = chainOpts.find(
              ({ id, currency }) => selected.chainId === id && selected.currency === currency
            );
            if (!chain) return null;

            return (
              <Stack direction='row' alignItems='center' gap={1}>
                <Image src={TOKEN_LOGO_RECORD[chain.currency]} alt={chain.currency} width={40} height={40} />
                <Stack>
                  <Stack flexDirection='row' gap={0.5} alignItems='center'>
                    <Typography variant='h6'>{chain.currency}</Typography>
                    <Typography variant='caption'>on {chain.name}</Typography>
                  </Stack>
                  <Stack direction='row' gap={1.5} alignItems='center'>
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography variant='caption'>Balance: {displayedBalance || '0'}</Typography>
                      <Image src={TOKEN_LOGO_RECORD[chain.currency]} alt={chain.currency} width={14} height={14} />
                    </Stack>
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography variant='caption'>
                        Min Bid: {minimumBid?.toFixed(chain.currency === 'ETH' ? 6 : 2)}
                      </Typography>
                      <Image src={TOKEN_LOGO_RECORD[chain.currency]} alt={chain.currency} width={14} height={14} />
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            );
          }}
          ref={ref}
          value={selectedToken}
          {...restProps}
        >
          {chainOpts.map((chain) => (
            <MenuItem
              key={`${chain.id}-${chain.currency}`}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onSelectChain({ chainId: chain.id, currency: chain.currency });
              }}
              sx={{ py: 1.5 }}
            >
              <ChainComponent
                chain={chain}
                balance={displayedBalance}
                selected={isSameOption({ chainId: chain.id, currency: chain.currency }, selectedToken)}
              />
            </MenuItem>
          ))}
        </Select>
      </Box>
      {selectedToken.currency === 'ETH' && prices?.eth && (
        <Typography variant='caption' color='text.secondary' align='right'>
          1 ETH = ${prices.eth.toFixed(2)}
        </Typography>
      )}
      {selectedToken.currency === 'DEV' && prices?.dev && (
        <Typography variant='caption' color='text.secondary' align='right'>
          1 DEV = ${prices.dev.toFixed(2)}
        </Typography>
      )}
    </Stack>
  );
}

export const DraftTokenSelector = forwardRef(SelectField);
