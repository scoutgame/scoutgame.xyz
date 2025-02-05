'use client';

import { LoadingButton } from '@mui/lab';

export function PartnerRewardClaimButton({
  isExecuting,
  handleClaim
}: {
  isExecuting: boolean;
  handleClaim: VoidFunction;
}) {
  return (
    <LoadingButton
      variant='contained'
      color='primary'
      sx={{
        width: 'fit-content'
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
