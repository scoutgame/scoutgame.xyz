import { Prisma, prisma } from '@charmverse/core/prisma-client';

import { registerDeveloperNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperNFT';
import { registerDeveloperStarterNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperStarterNFT';
import { refreshUserStats } from '@packages/scoutgame/refreshUserStats';

import { log } from '@charmverse/core/log';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { ISOWeek } from '@packages/dates/config';
import { randomWalletAddress } from '@packages/testing/generators';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { Address } from 'viem';

function getRandomValue<T>(arr: T[]): T {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

type DevUser = {
  id: number;
  avatar: string;
  farcasterId?: number;
};

const devUsers: Record<string, DevUser> = {
  mattcasey: {
    id: 305398,
    avatar: 'https://app.charmverse.io/favicon.png'
  },
  motechFR: {
    id: 18669748,
    avatar:
      'https://cdn.charmverse.io/user-content/e0ec0ec8-0c1f-4745-833d-52c448482d9c/0dd0e3c0-821c-49fc-bd1a-7589ada03019/1ff23917d3954f92aed4351b9c8caa36.jpg'
  },
  Devorein: {
    id: 25636858,
    avatar:
      'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg'
  },
  valentinludu: {
    id: 34683631,
    avatar:
      'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/42697dc0-35ad-4361-8311-a92702c76062/breaking_wave.jpg'
  },
  ccarella: {
    id: 199823,
    avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/43760426-bca9-406b-4afe-20138acd5f00/rectcrop3',
    farcasterId: 472
  }
  // piesrtasty: {
  //   id: 339341,
  //   avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/ea9d8fd1-fbf4-4ae3-21a2-c1ca069bf200/original',
  //   farcasterId: 547807,
  //   createStarterPack: true
  // },
  // maurelian: {
  //   id: 23033765,
  //   avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e2beaac4-eacd-472b-9e96-6ca93d9d3000/original',
  //   farcasterId: 4179,
  //   createStarterPack: true
  // }
};

const repoOwner = 'charmverse';

// Obtained from https://api.github.com/repos/scoutgame/scoutgame.xyz
const repoId = 444649883;

const repoName = 'app.charmverse.io';

export async function seedWithRealCharmverseGithubData() {
  // Initialize the github repo
  let githubRepo = await prisma.githubRepo.findFirst({
    where: {
      owner: repoOwner,
      name: repoName
    }
  });

  if (!githubRepo) {
    githubRepo = await prisma.githubRepo.create({
      data: {
        defaultBranch: 'main',
        name: repoName,
        owner: repoOwner,
        ownerType: 'org',
        id: repoId
      }
    });
  }

  const devUserEntries = Object.entries(devUsers);

  for (const [builder, { avatar, id, farcasterId }] of devUserEntries) {
    const githubUser = await prisma.githubUser.findUnique({
      where: {
        login: builder
      }
    });
    const farcasterUser = await prisma.scout.findFirst({
      where: {
        farcasterId: farcasterId
      }
    });

    if (!githubUser) {
      await prisma.githubUser.create({
        data: {
          id,
          login: builder,
          displayName: builder,
          builder: {
            create: {
              displayName: builder,
              referralCode: builder + Math.random().toString().replace('.', '').slice(0, 6),
              path: builder + Math.random().toString().replace('.', '').slice(0, 6),
              builderStatus: 'approved',
              avatar,
              // farcasterId is unique, so we don't want to attach to a new user if it already exists
              farcasterId: farcasterUser ? undefined : farcasterId
            }
          }
        }
      });
    } else if (!githubUser?.builderId) {
      await prisma.githubUser.update({
        where: {
          login: builder
        },
        data: {
          builder: {
            create: {
              referralCode: builder + Math.random().toString().replace('.', '').slice(0, 6),
              displayName: builder,
              path: builder,
              builderStatus: 'approved',
              avatar: avatar,
              // farcasterId is unique, so we don't want to attach to a new user if it already exists
              farcasterId: farcasterUser ? undefined : farcasterId
            }
          }
        }
      });
    }
  }
}

async function seedBuilderNFTs(season: ISOWeek = getCurrentSeasonStart()) {
  const githubUser = await prisma.githubUser.findMany({
    where: {
      login: {
        in: Object.keys(devUsers)
      }
    }
  });

  console.log('githubUser', githubUser);

  for (const { builderId, login } of githubUser) {
    log.info(`-- Processing builder ${login}`);
    const nft = await registerDeveloperNFT({ builderId: builderId as string, season });

    await registerDeveloperStarterNFT({ builderId: nft.builderId, season }).catch((error) => {
      log.error(`Error registering starter pack for ${login}`, { error });
    });

    await generateNftPurchaseEvents({ builderId: nft.builderId, amount: 4 });

    await refreshUserStats({ userId: builderId as string });

    await prisma.scout.update({
      where: {
        id: builderId as string
      },
      data: {
        builderStatus: 'approved'
      }
    });
  }
}

async function generateNftPurchaseEvents({
  builderId,
  amount = 1
}: {
  builderId: string;
  amount?: number;
}): Promise<void> {
  const nft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId
    }
  });

  const scoutId = await prisma.scout
    .findMany({
      where: {},
      take: 5
    })
    .then((data) => data.map((s) => s.id));

  const inputs: Prisma.NFTPurchaseEventCreateManyInput[] = Array.from({ length: amount }).map(
    (_, index) =>
      ({
        builderNftId: nft.id,
        pointsValue: 0,
        walletAddress: randomWalletAddress().toLowerCase(),
        tokensPurchased: 10,
        txLogIndex: index,
        txHash: `0xabc`
      }) as Prisma.NFTPurchaseEventCreateManyInput
  );

  for (const input of inputs) {
    await findOrCreateWalletUser({
      wallet: input.walletAddress as Address
    });
  }

  await prisma.nFTPurchaseEvent.createMany({ data: inputs });
}

async function clearNfts() {
  await prisma.builderNft.deleteMany({
    where: {
      builder: {
        githubUsers: {
          some: {
            login: {
              in: Object.keys(devUsers)
            }
          }
        }
      }
    }
  });
}

async function script() {
  // await prisma.scout.deleteMany({
  // });

  // await prisma.githubUser.deleteMany({
  // });

  await seedWithRealCharmverseGithubData();
  await seedBuilderNFTs('2025-W02');
}

async function seedPurchases() {}

script();
