import { prisma } from '@charmverse/core/prisma-client';
import { getMoxieFanToken } from '@packages/moxie/getMoxieFanToken';
import { getTalentProfile } from '@packages/scoutgame/talent/getTalentProfile';

export async function updateTalentProfile({
  builderId,
  farcasterId,
  wallets
}: {
  builderId: string;
  farcasterId: number | null;
  wallets: string[];
}) {
  const talentProfile = await getTalentProfile({
    farcasterId,
    wallets
  });

  if (talentProfile) {
    await prisma.talentProfile.upsert({
      where: { id: talentProfile.id },
      create: {
        id: talentProfile.id,
        builderId,
        score: talentProfile.score,
        address: talentProfile.wallet.toLowerCase()
      },
      update: {
        score: talentProfile.score,
        address: talentProfile.wallet.toLowerCase(),
        updatedAt: new Date()
      }
    });
  }
}
