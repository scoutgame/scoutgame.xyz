import { Stack, Typography } from '@mui/material';

export function BuilderCardActivityTooltip() {
  return (
    <Stack flexDirection='column' gap={2.5} width='fit-content'>
      <Stack>
        <Typography fontWeight='bold'>WEEK’S GEMS</Typography>
        <Typography>
          Number of Gems earned by contributing to approved projects for the current week. Developers are ranked by
          number of Gems earned at the end of each week. Higher rank leads to more Scout Points.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>LEVEL</Typography>
        <Typography>
          Represents the decile of the Developer's weekly valid github contributions amongst active developers. The top
          10% of Developers are Level 10.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>14D ACTIVITY</Typography>
        <Typography>
          Gem earnings over the past 14 days relative to benchmark. Benchmark is the average number of Gems earned daily
          by all active developers.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>PAYOUT</Typography>
        <Typography>
          Estimated weekly Scout Points rewarded to a Scout holding ONE of the Developer's regular cards.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>PRICE</Typography>
        <Typography>
          The current cost of the Developer’s Card in Scout Points. Purchase the Developer’s Card to scout the Developer
          and earn Scout Points as they move up the leader board. Builder cards may also be purchased with USDC or ETH
          on Optimism, Base, Arbitrum, and Zora.
        </Typography>
      </Stack>
    </Stack>
  );
}
