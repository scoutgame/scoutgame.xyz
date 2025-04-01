import { Stack, Typography } from '@mui/material';

import { DailyClaimGift } from '../../../../claim/components/common/DailyClaimGift';

export function Info() {
  return (
    <Stack borderRadius={1} alignItems='center' flexDirection='row' p={2} gap={1} bgcolor='primary.dark'>
      <DailyClaimGift size={50} />
      <Typography fontWeight={600}>
        +5 OP <img src='/images/crypto/op.png' alt='OP' width='14px' height='14px' /> for you and every player who signs
        up with your link, verifies their email, AND purchases a Standard Developer Card.
      </Typography>
    </Stack>
  );
}
