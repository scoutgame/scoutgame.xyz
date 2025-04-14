'use client';

import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';

import { ChainComponent } from '../../NFTPurchaseDialog/components/ChainSelector/ChainComponent';
import type { AvailableCurrency } from '../../NFTPurchaseDialog/components/ChainSelector/chains';

export type SelectedPaymentOption = { chainId: number; currency: AvailableCurrency };

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency;
}

// LINK token address on Base (placeholder for DEV token)
// TODO: Replace with DEV token address once its launched
export const DEV_TOKEN_ADDRESS = '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196';
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

function PaymentOptionSelector(
  {
    onSelectPaymentOption,
    selectedPaymentOption,
    selectedTokenBalance,
    address,
    disabled,
    prices,
    minimumBid,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectPaymentOption: (opt: SelectedPaymentOption) => void;
    selectedPaymentOption: SelectedPaymentOption;
    selectedTokenBalance?: number;
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
                      <Typography variant='caption'>
                        Balance: {selectedTokenBalance?.toFixed(chain.currency === 'ETH' ? 8 : 4) || '0'}
                      </Typography>
                      <Image src={TOKEN_LOGO_RECORD[chain.currency]} alt={chain.currency} width={14} height={14} />
                    </Stack>
                    <Stack direction='row' alignItems='center' gap={0.5}>
                      <Typography variant='caption'>
                        Min Bid: {minimumBid?.toFixed(chain.currency === 'ETH' ? 8 : 4)}
                      </Typography>
                      <Image src={TOKEN_LOGO_RECORD[chain.currency]} alt={chain.currency} width={14} height={14} />
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
          {chainOpts.map((chain) => (
            <MenuItem
              key={`${chain.id}-${chain.currency}`}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onSelectPaymentOption({ chainId: chain.id, currency: chain.currency });
              }}
              sx={{ py: 1.5 }}
            >
              <ChainComponent
                chain={chain}
                balance={selectedTokenBalance}
                selected={isSameOption({ chainId: chain.id, currency: chain.currency }, selectedPaymentOption)}
              />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  );
}

export const DraftPaymentOptionSelector = forwardRef(PaymentOptionSelector);
