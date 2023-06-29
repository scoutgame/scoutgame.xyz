import { prisma } from '@charmverse/core/src/prisma-client';
import type { ProfileFragment } from '@lens-protocol/client';
/* eslint-disable-next-line */
import { LensClient, development } from '@lens-protocol/client';

const lensClient = new LensClient({
  environment: development
});

export async function getDefaultLensProfile(userId: string): Promise<ProfileFragment | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          address: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const walletAddresses = user.wallets.map((wallet) => wallet.address);
  if (walletAddresses.length === 0) {
    return null;
  }

  // test wallet: 0x2b3DaEB14f069dB301cEAD63338a56d27A982CED
  const walletAddress = walletAddresses[0];
  const ownedProfiles = await lensClient.profile.fetchAll({
    ownedBy: [walletAddress],
    limit: 1
  });

  if (ownedProfiles.items.length === 0) {
    return null;
  }

  return ownedProfiles.items[0];
}
