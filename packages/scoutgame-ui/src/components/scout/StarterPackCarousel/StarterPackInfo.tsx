import { Box, Typography } from '@mui/material';
import { conditionalPlural } from '@packages/utils/strings';

export function StarterPackInfo({ remainingStarterCards = 3 }: { remainingStarterCards?: number }) {
  const remainingCardsPhrase =
    remainingStarterCards === 3
      ? `up to ${remainingStarterCards} cards`
      : `${remainingStarterCards} more ${conditionalPlural({ word: 'card', count: remainingStarterCards })}`;

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='h6' fontWeight={600} textAlign={{ xs: 'center', md: 'left' }} color='green.main'>
        Earn Scout Points
      </Typography>
      <Typography>Start your collection by purchasing {remainingCardsPhrase} from this Starter Pack!</Typography>
      <Typography>Starter Cards cost only 20 Scout Points, up to 95% off from regular Developer Cards!</Typography>
      <Typography variant='caption'>
        <sup>*</sup>Starter Cards earn 1/10 Scout Points compared to regular Developer Cards.
      </Typography>
    </Box>
  );
}
