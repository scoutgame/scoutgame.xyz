import { FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import Image from 'next/image';
import type { ReactNode } from 'react';

const chainOptions = [
  {
    id: 1,
    name: 'Ethereum',
    icon: '/images/crypto/ethereum-circle.png'
  },
  {
    id: 8453,
    name: 'Base',
    icon: '/images/crypto/base64.png'
  },
  {
    id: 42220,
    name: 'Celo',
    icon: '/images/crypto/celo.png'
  },
  {
    id: 10,
    name: 'Optimism',
    icon: '/images/crypto/op.png'
  }
];

type ChainSelectorProps = {
  value?: number;
  onChange: (value: number | undefined) => void;
  error?: ReactNode;
  helperText?: ReactNode;
};

function ChainDisplay({ chain }: { chain?: (typeof chainOptions)[number] }) {
  if (!chain) {
    return 'Select a Chain';
  }

  return (
    <Stack direction='row' spacing={1} alignItems='center'>
      <div style={{ width: 24, height: 24, position: 'relative' }}>
        <Image src={chain.icon} alt={chain.name} fill style={{ objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <span>{chain.name}</span>
    </Stack>
  );
}

export function ChainSelector({ error, helperText, value, onChange }: ChainSelectorProps) {
  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel id='chain-select-label'>Chain</InputLabel>
      <Select
        labelId='chain-select-label'
        label='Chain'
        value={value || 0}
        onChange={(e) => onChange(e.target.value === 0 ? undefined : (e.target.value as number))}
        renderValue={(selected) => {
          if (selected === 0) return <ChainDisplay />;
          const chain = chainOptions.find(({ id }) => id === selected);
          return <ChainDisplay chain={chain} />;
        }}
      >
        <MenuItem value={0} disabled>
          <ChainDisplay />
        </MenuItem>
        {chainOptions.map((chain) => (
          <MenuItem key={chain.id} value={chain.id} sx={{ py: 1.5 }}>
            <ChainDisplay chain={chain} />
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
