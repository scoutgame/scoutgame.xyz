import { Stack } from '@mui/material';
import { LoadingCard } from '@packages/scoutgame-ui/components/common/Loading/LoadingCard';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';

export function ScoutProfileLoading() {
  return (
    <Stack>
      <LoadingCard />
      <LoadingCards />
    </Stack>
  );
}
