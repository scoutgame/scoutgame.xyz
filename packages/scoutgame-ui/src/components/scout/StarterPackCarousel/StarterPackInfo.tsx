import { Box, Typography } from '@mui/material';

export function StarterPackInfo({ remainingStarterCards = 3 }: { remainingStarterCards?: number }) {
  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='h6' fontWeight={600} textAlign={{ xs: 'center', md: 'left' }} color='green.main'>
        Earn Scout Points
      </Typography>
      <Typography>
        Start your collection by purchasing up to {remainingStarterCards} cards from this Starter Pack!
      </Typography>
      <Typography>Starter Cards cost only 20 Scout Points, up to 95% off from regular Builder Cards!</Typography>
      <Typography variant='caption'>
        <sup>*</sup>Starter Cards earn 1/10 Scout Points compared to regular Builder Cards.
      </Typography>
    </Box>
  );
}
