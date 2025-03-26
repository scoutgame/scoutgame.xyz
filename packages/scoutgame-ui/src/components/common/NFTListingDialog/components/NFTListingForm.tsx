import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Typography } from '@mui/material';

export type NFTListingFormProps = {
  builder: { id: string; path: string; displayName: string; builderStatus: BuilderStatus | null };
};

export function NFTListingForm({ builder }: NFTListingFormProps) {
  return (
    <Box>
      <Typography variant='h6'>List {builder.displayName}</Typography>
    </Box>
  );
}
