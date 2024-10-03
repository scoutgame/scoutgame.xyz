import { MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { ChainComponent } from './ChainComponent';
import { getChainOptions } from './chains';

export type SelectedPaymentOption = { chainId: number; currency: 'ETH' | 'USDC' };

function isSameOption(a: SelectedPaymentOption, b: SelectedPaymentOption) {
  return a.chainId === b.chainId && a.currency === b.currency;
}

function SelectField(
  {
    useTestnets,
    balance,
    onSelectChain,
    value,
    ...props
  }: Omit<SelectProps<SelectedPaymentOption>, 'onClick' | 'value'> & {
    helperMessage?: ReactNode;
    onSelectChain: (opt: SelectedPaymentOption) => void;
    value: SelectedPaymentOption;
    useTestnets?: boolean;
    balance?: string;
  },
  ref: Ref<unknown>
) {
  const { helperMessage, ...restProps } = props;

  const chainOpts = getChainOptions({ useTestnets });

  return (
    <Select<SelectedPaymentOption>
      fullWidth
      displayEmpty
      renderValue={(selected) => {
        const chain = chainOpts.find(({ id, currency }) => selected.chainId === id && selected.currency === currency);

        if (!chain) {
          return (
            <Stack>
              <Typography variant='body2'>Select a Chain</Typography>
            </Stack>
          );
        }

        return <ChainComponent chain={chain} balance={balance} />;
      }}
      ref={ref}
      value={value}
      {...restProps}
    >
      <MenuItem value='' disabled>
        Select a Chain
      </MenuItem>
      {chainOpts.map((_chain) => (
        <MenuItem
          key={_chain.id + _chain.currency} // Unique key for each chain and currency combination
          value={_chain.id}
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onSelectChain({ chainId: _chain.id, currency: _chain.currency });
          }}
          sx={{ py: 1.5 }}
        >
          <ChainComponent
            chain={_chain}
            selected={isSameOption({ chainId: _chain.id, currency: _chain.currency }, value)}
          />
        </MenuItem>
      ))}
    </Select>
  );
}

export const BlockchainSelect = forwardRef(SelectField);
