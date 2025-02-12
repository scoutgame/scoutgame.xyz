'use client';

import { LoadingButton } from '@mui/lab';
import type { SxProps } from '@mui/material';

export function PointsClaimButton({
  isExecuting,
  handleClaim,
  sx
}: {
  isExecuting: boolean;
  handleClaim: VoidFunction;
  sx?: SxProps;
}) {
  return (
    <LoadingButton
      variant='contained'
      color='primary'
      sx={{
        width: {
          xs: 'fit-content',
          md: '100%'
        },
        ...sx
      }}
      loading={isExecuting}
      data-test='claim-points-button'
      disabled={isExecuting}
      onClick={handleClaim}
    >
      Claim
    </LoadingButton>
  );
}
