'use client';

import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';

import { ChainComponent } from '../../NFTPurchaseDialog/components/ChainSelector/ChainComponent';

export type AvailableCurrency = 'ETH' | 'USDC' | 'DEV';

export type SelectedPaymentOption = {
  decimals: number;
  chainId: number;
  currency: AvailableCurrency;
  address: Address;
};

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency && a.address === b.address;
}

// IoTeX token address on Base (placeholder for DEV token)
// TODO: Replace with DEV token address once its launched
export const DEV_TOKEN_ADDRESS = '0xBCBAf311ceC8a4EAC0430193A528d9FF27ae38C1';
export const OPTIMISM_USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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

export const TOKEN_LOGO_RECORD = {
  ETH: '/images/crypto/ethereum-eth-logo.png',
  USDC: '/images/crypto/usdc.png',
  DEV: '/images/crypto/dev-token-logo.png'
};

export type PaymentOption = {
  chain: {
    id: number;
    name: string;
  };
  address: Address;
  currency: AvailableCurrency;
  decimals: number;
};

export const DEV_PAYMENT_OPTION: PaymentOption = {
  ...baseChainOption,
  address: DEV_TOKEN_ADDRESS,
  currency: 'DEV' as const,
  decimals: 18
};

export const BASE_USDC_PAYMENT_OPTION: PaymentOption = {
  ...baseChainOption,
  address: BASE_USDC_ADDRESS,
  currency: 'USDC' as const,
  decimals: 6
};

const paymentOptions: PaymentOption[] = [
  DEV_PAYMENT_OPTION,
  {
    ...baseChainOption,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  BASE_USDC_PAYMENT_OPTION,
  {
    ...optimismChainOption,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  {
    ...optimismChainOption,
    address: OPTIMISM_USDC_ADDRESS,
    currency: 'USDC' as const,
    decimals: 6
  }
];

// Remove trailing zeros after decimal point
// Examples: 1.000000 -> 1, 1.100000 -> 1.1, 1.000100 -> 1.0001
function formatNumber(num: number, maxDecimals: number): string {
  // Convert to string with fixed decimal places
  const fixed = num.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point and remove decimal point if no decimals
  return fixed.replace(/\.?0+$/, '');
}

function PaymentOptionSelector(
  {
    onSelectPaymentOption,
    selectedPaymentOption,
    selectedTokenBalance,
    address,
    disabled,
    prices,
    minimumBid,
    tokensWithBalances,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectPaymentOption: (opt: SelectedPaymentOption) => void;
    selectedPaymentOption: SelectedPaymentOption;
    selectedTokenBalance?: number;
    tokensWithBalances?: {
      chainId: number;
      address: Address;
      balance: number;
    }[];
    address: Address;
    prices?: {
      eth: number;
      dev: number;
    };
    minimumBid?: number;
    disabled?: boolean;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  return (
    <Stack gap={1} my={1}>
      <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'>
        <Typography color='secondary' fontWeight={500}>
          Select Tokens
        </Typography>
        {selectedPaymentOption.currency === 'ETH' && prices?.eth && (
          <Typography align='right' fontWeight={500}>
            1 ETH = ${prices.eth.toFixed(2)}
          </Typography>
        )}
        {selectedPaymentOption.currency === 'DEV' && prices?.dev && (
          <Typography align='right' fontWeight={500}>
            1 DEV = ${prices.dev.toFixed(2)}
          </Typography>
        )}
      </Stack>
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
          disabled={disabled}
          renderValue={(selected) => {
            const paymentOption = paymentOptions.find(
              ({ chain, currency }) => selected.chainId === chain.id && selected.currency === currency
            );
            if (!paymentOption) return null;

            return (
              <Stack direction='row' alignItems='center' gap={1}>
                <Image
                  src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                  alt={paymentOption.currency}
                  width={30}
                  height={30}
                />
                <Stack>
                  <Stack flexDirection='row' gap={0.5} alignItems='center'>
                    <Typography>{paymentOption.currency}</Typography>
                    <Typography variant='caption'>on {paymentOption.chain.name}</Typography>
                  </Stack>
                  <Stack direction='row' gap={1.5} alignItems='center'>
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography variant='caption'>
                        Balance:{' '}
                        {selectedTokenBalance ? formatNumber(selectedTokenBalance, paymentOption.decimals) : '0'}
                      </Typography>
                      <Image
                        src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                        alt={paymentOption.currency}
                        width={14}
                        height={14}
                      />
                    </Stack>
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography variant='caption'>
                        Min Bid: {minimumBid ? formatNumber(minimumBid, paymentOption.decimals) : '0'}
                      </Typography>
                      <Image
                        src={TOKEN_LOGO_RECORD[paymentOption.currency]}
                        alt={paymentOption.currency}
                        width={14}
                        height={14}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            );
          }}
          ref={ref}
          value={selectedPaymentOption}
          {...restProps}
        >
          {paymentOptions.map((paymentOption) => (
            <MenuItem
              key={`${paymentOption.chain.id}-${paymentOption.currency}-${paymentOption.address}`}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onSelectPaymentOption({
                  chainId: paymentOption.chain.id,
                  currency: paymentOption.currency,
                  address: paymentOption.address,
                  decimals: paymentOption.decimals
                });
              }}
              sx={{ py: 1.5 }}
            >
              <ChainComponent
                chain={{
                  id: paymentOption.chain.id,
                  name: paymentOption.chain.name,
                  icon: TOKEN_LOGO_RECORD[paymentOption.currency],
                  currency: paymentOption.currency
                }}
                balance={
                  tokensWithBalances?.find(
                    (token) => token.chainId === paymentOption.chain.id && token.address === paymentOption.address
                  )?.balance
                }
                selected={isSameOption(
                  {
                    chainId: paymentOption.chain.id,
                    ...paymentOption
                  },
                  selectedPaymentOption
                )}
              />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  );
}

export const DraftPaymentOptionSelector = forwardRef(PaymentOptionSelector);
