import { Stack, Typography } from '@mui/material';

import { DailyClaimGift } from '../../claim/components/common/DailyClaimGift';

export function Info() {
  return (
    <Stack borderRadius={1} alignItems='center' flexDirection='row' p={2} gap={1} bgcolor='primary.dark'>
      <DailyClaimGift size={50} />
      <Typography fontWeight={600}>
        +10 <img src='/images/profile/scout-game-icon.svg' alt='points' /> for every player that signs up with your
        link. <br />
        +40 <img src='/images/profile/scout-game-icon.svg' alt='points' /> if the player buys a Builder Card.
      </Typography>
    </Stack>
  );
}
