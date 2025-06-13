'use client';

import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { NULL_EVM_ADDRESS, OPTIMISM_USDC_ADDRESS, BASE_USDC_ADDRESS } from '@packages/blockchain/constants';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Address } from 'viem';
import { base, celo, optimism } from 'viem/chains';

import { ChainComponent } from 'components/common/NFTPurchaseDialog/components/ChainSelector/ChainComponent';

export type AvailableCurrency = 'ETH' | 'USDC' | 'DEV' | 'CELO';

const chainConfig = {
  [base.id]: {
    icon: '/images/crypto/base64.png',
    name: 'Base'
  },
  [optimism.id]: {
    icon: '/images/crypto/op.png',
    name: 'Optimism'
  },
  [celo.id]: {
    icon: '/images/crypto/celo.png',
    name: 'Celo'
  }
};

export type SelectedPaymentOption = {
  decimals: number;
  chainId: keyof typeof chainConfig;
  currency: AvailableCurrency;
  address: Address;
};

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency && a.address === b.address;
}

export const TOKEN_LOGO_RECORD = {
  ETH: '/images/crypto/ethereum-eth-logo.png',
  USDC: '/images/crypto/usdc.png',
  DEV: '/images/crypto/dev-token-logo.png',
  CELO: '/images/crypto/celo.png'
};

export type PaymentOption = {
  chainId: keyof typeof chainConfig;
  address: Address;
  currency: AvailableCurrency;
  decimals: number;
};

export const DEV_PAYMENT_OPTION: PaymentOption = {
  chainId: base.id,
  address: devTokenContractAddress,
  currency: 'DEV' as const,
  decimals: 18
};

export const BASE_USDC_PAYMENT_OPTION: PaymentOption = {
  chainId: base.id,
  address: BASE_USDC_ADDRESS,
  currency: 'USDC' as const,
  decimals: 6
};

const paymentOptions: PaymentOption[] = [
  DEV_PAYMENT_OPTION,
  {
    chainId: base.id,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  BASE_USDC_PAYMENT_OPTION,
  {
    chainId: optimism.id,
    address: NULL_EVM_ADDRESS,
    currency: 'ETH' as const,
    decimals: 18
  },
  {
    chainId: optimism.id,
    address: OPTIMISM_USDC_ADDRESS,
    currency: 'USDC' as const,
    decimals: 6
  }
];

function PaymentOptionSelector(
  {
    onSelectPaymentOption,
    selectedPaymentOption,
    selectedTokenBalance,
    disabled,
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
    disabled?: boolean;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  return (
    <Stack gap={1} my={1}>
      <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'>
        <Typography color='secondary' fontWeight={500} gutterBottom>
          Select Tokens
        </Typography>
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
              ({ chainId, currency }) => selected.chainId === chainId && selected.currency === currency
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
                    <Typography variant='caption'>on {chainConfig[paymentOption.chainId]?.name}</Typography>
                  </Stack>
                  <Stack direction='row' gap={0.5} alignItems='center'>
                    <Typography variant='caption'>
                      Balance:{' '}
                      {selectedTokenBalance
                        ? paymentOption.currency === 'DEV'
                          ? selectedTokenBalance.toFixed(4)
                          : paymentOption.currency === 'ETH'
                            ? selectedTokenBalance.toFixed(6)
                            : selectedTokenBalance.toFixed(2)
                        : '0'}
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
            );
          }}
          ref={ref}
          value={selectedPaymentOption}
          {...restProps}
        >
          {paymentOptions.map((paymentOption) => (
            <MenuItem
              key={`${paymentOption.chainId}-${paymentOption.currency}-${paymentOption.address}`}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onSelectPaymentOption({
                  chainId: paymentOption.chainId,
                  currency: paymentOption.currency,
                  address: paymentOption.address,
                  decimals: paymentOption.decimals
                });
              }}
              sx={{ py: 1.5 }}
            >
              <ChainComponent
                chain={{
                  id: paymentOption.chainId,
                  name: chainConfig[paymentOption.chainId]?.name,
                  icon: TOKEN_LOGO_RECORD[paymentOption.currency],
                  currency: paymentOption.currency
                }}
                balance={
                  tokensWithBalances?.find(
                    (token) =>
                      token.chainId === paymentOption.chainId &&
                      token.address.toLowerCase() === paymentOption.address.toLowerCase()
                  )?.balance
                }
                selected={isSameOption(paymentOption, selectedPaymentOption)}
              />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  );
}

export const PaymentTokenSelector = forwardRef(PaymentOptionSelector);
