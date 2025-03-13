import type { GemsReceiptType } from '@charmverse/core/prisma-client';

export const gemsValues: Record<GemsReceiptType, number> = {
  first_pr: 20,
  third_pr_in_streak: 30,
  regular_pr: 10,
  regular_pr_unreviewed: 2,
  daily_commit: 1,
  onchain_achievement: 0 // NOTE: actual value is dependent on the tier and # of builders
};
