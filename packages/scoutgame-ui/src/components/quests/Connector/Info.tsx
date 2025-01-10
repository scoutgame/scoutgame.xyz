import { Stack, Typography } from '@mui/material';
import { FaTrophy } from 'react-icons/fa6';

import { brandColor } from '../../../theme/colors';

export function Info({ token = 'OP', sum = 25 }: { token?: string; sum?: number }) {
  return (
    <Stack borderRadius={1} alignItems='center' flexDirection='row' p={2} gap={1} bgcolor='primary.dark'>
      <FaTrophy size={60} color={brandColor} />
      <Typography fontWeight={600}>
        Every day, the Scout with the most referral points wins {sum} {token}
      </Typography>
    </Stack>
  );
}
