'use client';

import { Button } from '@mui/material';
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
    <Button
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
    </Button>
  );
}
