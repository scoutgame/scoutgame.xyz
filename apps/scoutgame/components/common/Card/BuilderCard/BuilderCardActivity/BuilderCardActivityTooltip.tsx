import { Stack, Typography } from '@mui/material';

export function BuilderCardActivityTooltip() {
  return (
    <Stack flexDirection='column' gap={2.5} width='fit-content'>
      <Stack>
        <Typography fontWeight='bold'>LEVEL</Typography>
        <Typography>
          Represents the percentile of the Developer's weekly Scout Point average relative to the point average of all
          active developers. The top 10% of Developers are Level 10.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>RANK</Typography>
        <Typography>
          14 day rank history followed by today's rank. Vertical axis max is rank 1 and min is rank 100. Benchmark is
          set at rank = 50.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>WEEK'S GEMS</Typography>
        <Typography>
          Number of Gems earned by contributing to approved projects for the current week. Developers are ranked by
          number of Gems earned at the end of each week. Higher rank leads to more Scout Points.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>EST. PAYOUT</Typography>
        <Typography>
          Estimated weekly Scout Points rewarded to a Scout holding ONE of the Developer's regular cards.
        </Typography>
      </Stack>

      <Stack>
        <Typography fontWeight='bold'>PRICE</Typography>
        <Typography>
          The current cost of the Developer's Card in Scout Points. Purchase the Developer's Card to scout the Developer
          and earn Scout Points as they move up the leader board. Developer cards may also be purchased with USDC or ETH
          on Optimism, Base, Arbitrum, and Zora.
        </Typography>
      </Stack>
    </Stack>
  );
}
