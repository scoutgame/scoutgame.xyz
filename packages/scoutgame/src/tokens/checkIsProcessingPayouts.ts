import { prisma } from '@charmverse/core/prisma-client';

export async function checkIsProcessingPayouts({ week }: { week: string }) {
  const currentWeekPayout = await prisma.weeklyClaims.findUnique({
    where: {
      week
    }
  });

  return currentWeekPayout === null;
}
