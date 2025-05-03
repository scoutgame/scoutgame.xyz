import { Stack, Typography } from '@mui/material';
import { ceilToPrecision } from '@packages/utils/numbers';
import Image from 'next/image';

export function TokensCell({ tokens }: { tokens: number }) {
  return (
    <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
      <Typography>{ceilToPrecision(tokens, 4).toLocaleString()}</Typography>
      <Image alt='scout game icon' src='/images/dev-token-logo.png' width={20} height={20} />
    </Stack>
  );
}
