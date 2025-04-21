'use client';

import type { ButtonProps } from '@mui/material';
import { Typography, CircularProgress, Stack, Button } from '@mui/material';
import { useIsFarcasterFrame } from '@packages/scoutgame-ui/hooks/useIsFarcasterFrame';
import Link from 'next/link';

export function LoginButton({
  variant = 'contained',
  label = 'Get started'
}: {
  variant?: ButtonProps['variant'];
  label?: string;
}) {
  const isFarcasterFrame = useIsFarcasterFrame();

  return isFarcasterFrame ? (
    <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' width='100%'>
      <CircularProgress size={20} />
      <Typography variant='h6'>Logging in...</Typography>
    </Stack>
  ) : (
    <Button
      variant={variant}
      sx={{
        my: 2,
        width: '50%',
        mx: {
          xs: 'auto',
          md: 0
        }
      }}
      data-test='get-started-button'
    >
      <Link href='/login'>{label}</Link>
    </Button>
  );
}
