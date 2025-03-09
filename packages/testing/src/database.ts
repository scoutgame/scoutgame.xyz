import type {
  BuilderEvent,
  BuilderEventType,
  BuilderNftType,
  GithubRepo,
  Scout,
  ScoutProjectContract,
  ScoutProjectMemberRole
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { randomString } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';
import type { Address } from 'viem';

import { randomLargeInt, mockSeason, randomWalletAddress } from './generators';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

export async function mockBuilder({
  id,
  createdAt,
  displayName = 'Test User',
  builderStatus = 'approved',
  githubUserId = randomLargeInt(),
  githubUserLogin = `github_user:${githubUserId}`,
  onboardedAt,
  currentBalance,
  path = uuid(),
  agreedToTermsAt = new Date(),
  nftSeason = mockSeason,
  createNft = false,
  referralCode = randomString(),
  farcasterId,
  farcasterName,
  wallets = [{ address: randomWalletAddress() }],
  weeklyStats = [],
  onchainProfileAttestationChainId,
  onchainProfileAttestationUid
}: Partial<
  Scout & {
    githubUserId?: number;
    githubUserLogin?: string;
    createNft?: boolean;
    nftSeason?: string;
    wallets?: { address: string }[];
  } & {
    weeklyStats?: {
      week: string;
      season: string;
      gemsCollected: number;
      rank?: number;
    }[];
  }
> = {}) {
  const result = await prisma.scout.create({
    data: {
      id,
      createdAt,
      currentBalance,
      path,
      displayName,
      builderStatus,
      onboardedAt,
      agreedToTermsAt,
      farcasterId,
      referralCode,
      farcasterName,
      onchainProfileAttestationUid,
      onchainProfileAttestationChainId,
      wallets: wallets.length
        ? {
            createMany: {
              data: wallets.map((wallet, index) => ({
                address: wallet.address,
                primary: index === 0
              }))
            }
          }
        : undefined,
      githubUsers: {
        create: {
          id: githubUserId,
          login: githubUserLogin
        }
      },
      userWeeklyStats: weeklyStats.length
        ? {
            createMany: {
              data: weeklyStats.map(({ gemsCollected, season, week }) => ({
                gemsCollected,
                season,
                week
              }))
            }
          }
        : undefined
    },
    include: {
      githubUsers: true
    }
  });

  if (createNft) {
    await mockBuilderNft({ builderId: result.id, season: nftSeason });
  }
  const { githubUsers, ...scout } = result;
  return { ...scout, githubUser: githubUsers[0]! };
}

export type MockBuilder = Awaited<ReturnType<typeof mockBuilder>>;

export async function mockScout({
  id,
  createdAt,
  path = `user-${uuid()}`,
  displayName = 'Test Scout',
  nftWeek,
  utmCampaign,
  agreedToTermsAt = new Date(),
  onboardedAt = new Date(),
  builderId,
  season,
  email,
  bio,
  walletENS,
  farcasterName,
  referralCode = randomString(),
  currentBalance,
  avatar,
  farcasterId,
  deletedAt,
  telegramId,
  wallets = [randomWalletAddress()],
  stats,
  verifiedEmail
}: {
  id?: string;
  wallets?: string[];
  createdAt?: Date;
  avatar?: string;
  path?: string;
  agreedToTermsAt?: Date | null;
  nftWeek?: string;
  onboardedAt?: Date | null;
  displayName?: string;
  builderId?: string; // automatically "scout" a builder
  season?: string;
  email?: string;
  bio?: string;
  walletENS?: string;
  referralCode?: string;
  currentBalance?: number;
  farcasterName?: string;
  farcasterId?: number;
  deletedAt?: Date;
  telegramId?: number;
  utmCampaign?: string;
  stats?: {
    allTime?: {
      pointsEarnedAsScout?: number;
      pointsEarnedAsBuilder?: number;
    };
    season?: {
      nftsPurchased?: number;
      pointsEarnedAsScout?: number;
      pointsEarnedAsBuilder?: number;
    };
  };
  verifiedEmail?: boolean;
} = {}) {
  email ||= randomString();
  const scout = await prisma.scout.create({
    data: {
      id,
      createdAt,
      path,
      agreedToTermsAt,
      onboardedAt,
      displayName,
      email,
      referralCode,
      bio,
      walletENS,
      currentBalance,
      avatar,
      farcasterName,
      farcasterId,
      deletedAt,
      utmCampaign,
      telegramId,
      wallets: {
        createMany: {
          data: wallets.map((address, index) => ({
            address,
            primary: index === 0
          }))
        }
      }
    }
  });

  if (builderId) {
    await mockNFTPurchaseEvent({ builderId, scoutId: scout.id, season, week: nftWeek });
    await mockScoutedNft({ builderId, scoutId: scout.id, season, nftType: 'default' });
  }
  if (stats) {
    if (stats.allTime) {
      await mockUserAllTimeStats({ userId: scout.id, ...stats.allTime });
    }
    if (stats.season) {
      if (!season) {
        throw new Error('Season is required to mock user season stats');
      }
      await prisma.userSeasonStats.create({
        data: { userId: scout.id, ...stats.season, season }
      });
    }
  }
  if (verifiedEmail) {
    await prisma.scoutEmailVerification.create({
      data: {
        email,
        scoutId: scout.id,
        completedAt: new Date(),
        code: randomString()
      }
    });
  }
  return scout;
}

export async function mockGemPayoutEvents({
  builderId,
  recipients,
  gems = 10,
  week = getCurrentWeek(),
  season = mockSeason
}: {
  builderId: string;
  recipients: { id: string; points: number; recipientType: 'scout' | 'builder' }[];
  week?: string;
  gems?: number;
  season?: string;
}) {
  const event = await prisma.gemsPayoutEvent.create({
    data: {
      gems,
      points: 0,
      week,
      season,
      builder: {
        connect: {
          id: builderId
        }
      },
      builderEvent: {
        create: {
          season,
          type: 'gems_payout',
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: builderId
            }
          },
          pointsReceipts: {
            createMany: {
              data: recipients.map(({ id, points }) => ({
                value: points,
                recipientId: id,
                season
              }))
            }
          }
        }
      }
    }
  });
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      event: {
        gemsPayoutEventId: event.id
      }
    }
  });

  // create actvities so we know how they earned the points
  await prisma.scoutGameActivity.createMany({
    data: pointsReceipts.map(({ id: pointsReceiptId, recipientId }) => ({
      recipientType: recipients.find(({ id }) => id === recipientId)!.recipientType,
      type: 'points',
      userId: recipientId!,
      pointsReceiptId
    }))
  });

  return event;
}

export async function mockGemPayoutEvent({
  builderId,
  recipientId,
  amount = 10,
  week = getCurrentWeek(),
  season = mockSeason
}: {
  builderId: string;
  recipientId: string;
  amount?: number;
  week?: string;
  season?: string;
}) {
  return prisma.gemsPayoutEvent.create({
    data: {
      gems: amount,
      points: 0,
      week,
      season,
      builder: {
        connect: {
          id: builderId
        }
      },
      builderEvent: {
        create: {
          season,
          type: 'gems_payout',
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: builderId
            }
          },
          pointsReceipts: {
            create: {
              value: amount,
              recipientId,
              season,
              activities: {
                create: {
                  recipientType: 'scout',
                  type: 'points',
                  userId: recipientId
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function mockBuilderEvent({
  builderId,
  eventType,
  week = getCurrentWeek(),
  createdAt = new Date()
}: {
  builderId: string;
  eventType: BuilderEventType;
  week?: string;
  createdAt?: Date;
}) {
  return prisma.builderEvent.create({
    data: {
      createdAt,
      builderId,
      season: mockSeason,
      type: eventType,
      week
    }
  });
}

export async function mockGithubUser({ builderId }: { builderId?: string } = {}) {
  const id = randomLargeInt();

  const name = `github_user:${id}`;
  return prisma.githubUser.create({
    data: {
      login: name,
      builderId,
      displayName: name,
      id
    }
  });
}

export async function mockPullRequestBuilderEvent({
  repoOwner,
  repoName,
  pullRequestNumber = randomLargeInt(),
  season = mockSeason,
  builderId
}: {
  pullRequestNumber?: number;
  githubUserId: number;
  builderId: string;
  season?: string;
  id?: number;
} & RepoAddress): Promise<BuilderEvent> {
  const githubUser = await prisma.githubUser.findFirstOrThrow({ where: { builderId } });

  const repo = await mockRepo({ owner: repoOwner, name: repoName });

  const githubEvent = await prisma.githubEvent.create({
    data: {
      repoId: repo.id,
      pullRequestNumber,
      title: `Mock Pull Request ${pullRequestNumber}`,
      type: 'merged_pull_request',
      createdBy: githubUser.id,
      url: ``
    }
  });

  const builderEvent = await prisma.builderEvent.create({
    data: {
      builderId: builderId as string,
      season,
      type: 'merged_pull_request',
      githubEventId: githubEvent.id,
      week: getCurrentWeek()
    }
  });

  return builderEvent;
}

export function mockRepo(fields: Partial<GithubRepo> & { owner?: string } = {}) {
  return prisma.githubRepo.create({
    data: {
      ...fields,
      id: fields.id ?? randomLargeInt(),
      name: fields.name ?? `test_repo_${Math.floor(Math.random() * 1000) + 1}`,
      owner: fields.owner ?? `test_owner_${Math.floor(Math.random() * 1000) + 1}`,
      ownerType: fields.ownerType ?? 'org',
      defaultBranch: fields.defaultBranch ?? 'main'
    }
  });
}

export async function mockNFTPurchaseEvent({
  builderId,
  scoutId,
  points = 0,
  week = getCurrentWeek(),
  season = mockSeason,
  tokensPurchased = 1,
  nftType,
  walletAddress
}: {
  builderId: string;
  scoutId: string;
  points?: number;
  season?: string;
  tokensPurchased?: number;
  week?: string;
  nftType?: BuilderNftType;
  walletAddress?: string;
}) {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season,
      nftType: nftType ?? 'default'
    }
  });

  const scoutWallet = await prisma.scoutWallet
    .findFirst({ where: { scoutId, address: walletAddress } })
    .then((wallet) => {
      if (walletAddress && !wallet) {
        throw new Error('Scout wallet not found');
      }
      return wallet ?? prisma.scoutWallet.create({ data: { scoutId, address: randomWalletAddress() } });
    });

  return prisma.builderEvent.create({
    data: {
      builder: {
        connect: {
          id: builderId
        }
      },
      season,
      type: 'nft_purchase',
      week,
      nftPurchaseEvent: {
        create: {
          builderNftId: builderNft.id,
          walletAddress: scoutWallet.address,
          txLogIndex: 0,
          pointsValue: points,
          txHash: `0x${Math.random().toString(16).substring(2)}`,
          tokensPurchased
        }
      },
      pointsReceipts: {
        create: {
          value: points,
          season,
          recipientId: builderId,
          senderId: scoutId
        }
      }
    },
    include: { nftPurchaseEvent: { include: { scoutWallet: true } } }
  });
}

export async function mockNFTBurnEvent({
  builderId,
  points = 0,
  week = getCurrentWeek(),
  season = mockSeason,
  tokensBurned = 1,
  nftType,
  walletAddress
}: {
  builderId: string;
  points?: number;
  season?: string;
  tokensBurned?: number;
  week?: string;
  nftType?: BuilderNftType;
  walletAddress?: string;
}) {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season,
      nftType: nftType ?? 'default'
    }
  });

  const scoutWallet = await prisma.scoutWallet.findFirstOrThrow({ where: { address: walletAddress } });

  return prisma.builderEvent.create({
    data: {
      builder: {
        connect: {
          id: builderId
        }
      },
      season,
      type: 'nft_purchase',
      week,
      nftPurchaseEvent: {
        create: {
          builderNftId: builderNft.id,
          senderWalletAddress: scoutWallet.address,
          txLogIndex: 0,
          pointsValue: points,
          txHash: `0x${Math.random().toString(16).substring(2)}`,
          tokensPurchased: tokensBurned
        }
      }
    },
    include: { nftPurchaseEvent: { include: { scoutWallet: true } } }
  });
}

export async function mockNFTTransferEvent({
  builderId,
  points = 0,
  week = getCurrentWeek(),
  season = mockSeason,
  tokensTransferred = 1,
  nftType,
  from,
  to
}: {
  builderId: string;
  points?: number;
  season?: string;
  tokensTransferred?: number;
  week?: string;
  nftType?: BuilderNftType;
  from: Address;
  to: Address;
}) {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season,
      nftType: nftType ?? 'default'
    }
  });

  const fromScoutWallet = await prisma.scoutWallet.findFirstOrThrow({
    where: { address: from.toLowerCase() }
  });

  const toScoutWallet = await prisma.scoutWallet.findFirstOrThrow({ where: { address: to.toLowerCase() } });

  return prisma.builderEvent.create({
    data: {
      builder: {
        connect: {
          id: builderId
        }
      },
      season,
      type: 'nft_purchase',
      week,
      nftPurchaseEvent: {
        create: {
          builderNftId: builderNft.id,
          walletAddress: toScoutWallet.address,
          senderWalletAddress: fromScoutWallet.address,
          txLogIndex: 0,
          pointsValue: points,
          txHash: `0x${Math.random().toString(16).substring(2)}`,
          tokensPurchased: tokensTransferred
        }
      }
    },
    include: { nftPurchaseEvent: { include: { scoutWallet: true } } }
  });
}

export async function mockScoutedNft({
  builderNftId,
  builderId,
  scoutId,
  balance = 1,
  season,
  nftType
}: {
  builderNftId?: string;
  builderId?: string;
  scoutId: string;
  balance?: number;
  nftType?: BuilderNftType;
  season?: string;
}) {
  if (!builderNftId && !builderId) {
    throw new Error('Either builderNftId or builderId must be provided');
  }
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: builderNftId
      ? { id: builderNftId }
      : {
          builderId,
          season,
          nftType: nftType ?? 'default'
        }
  });
  const wallet = await prisma.scoutWallet.findFirstOrThrow({ where: { scoutId } });

  return prisma.scoutNft.create({
    data: {
      builderNftId: builderNft.id,
      walletAddress: wallet.address,
      balance
    }
  });
}

export async function mockBuilderNft({
  builderId,
  chainId = 1,
  tokenId = Math.round(Math.random() * 10000000),
  contractAddress = '0x1',
  owners = [],
  season = mockSeason,
  currentPrice = 100,
  nftType,
  estimatedPayout
}: {
  builderId: string;
  chainId?: number;
  contractAddress?: string;
  currentPrice?: number;
  owners?: (string | { id: string })[];
  season?: string;
  tokenId?: number;
  nftType?: BuilderNftType;
  estimatedPayout?: number;
}) {
  const ownerWallets =
    typeof owners[0] === 'string'
      ? await Promise.all(
          owners.map(async (owner) => {
            const scoutId = owner as string;
            const existingWallet = await prisma.scoutWallet.findFirst({
              where: { scoutId }
            });
            if (existingWallet) {
              return existingWallet;
            }
            return prisma.scoutWallet.create({
              data: {
                scoutId,
                address: randomWalletAddress()
              }
            });
          })
        )
      : await Promise.all(
          (owners as { id: string }[]).map(async (owner) => {
            const existingWallet = await prisma.scoutWallet.findFirst({
              where: { scoutId: owner.id }
            });
            if (existingWallet) {
              return existingWallet;
            }
            return prisma.scoutWallet.create({
              data: {
                scoutId: owner.id,
                address: randomWalletAddress()
              }
            });
          })
        );

  const nft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      currentPrice,
      season,
      imageUrl: 'https://placehold.co/600x400',
      tokenId,
      nftType: nftType ?? 'default',
      nftSoldEvents: {
        createMany: {
          data: owners.map((owner, index) => ({
            walletAddress: ownerWallets[index].address,
            pointsValue: 10,
            txHash: `0x${Math.random().toString(16).substring(2)}`,
            tokensPurchased: 1,
            txLogIndex: 0
          }))
        }
      },
      estimatedPayout
    }
  });
  for (const owner of owners) {
    await mockNFTPurchaseEvent({
      builderId,
      season: nft.season,
      scoutId: typeof owner === 'string' ? owner : owner.id
    });
  }
  return nft;
}

export async function mockBuilderStrike({
  builderId,
  pullRequestNumber,
  repoOwner = 'test_owner',
  repoName = 'test_repo'
}: {
  builderId: string;
  pullRequestNumber?: number;
} & Partial<RepoAddress>) {
  const githubUser = await prisma.githubUser.findFirstOrThrow({ where: { builderId } });
  const githubBuilderEvent = await mockPullRequestBuilderEvent({
    githubUserId: githubUser.id,
    pullRequestNumber,
    repoName,
    repoOwner,
    builderId
  });

  return prisma.builderStrike.create({
    data: {
      builderId,
      githubEventId: githubBuilderEvent.githubEventId as string
    }
  });
}

export function mockUserSeasonStats({
  userId,
  season,
  nftsPurchased = 1,
  pointsEarnedAsBuilder = Math.floor(Math.random() * 1000),
  pointsEarnedAsScout = Math.floor(Math.random() * 1000)
}: {
  userId: string;
  season: string;
  nftsPurchased?: number;
  pointsEarnedAsBuilder?: number;
  pointsEarnedAsScout?: number;
}) {
  return prisma.userSeasonStats.create({
    data: {
      userId,
      season,
      nftsPurchased,
      pointsEarnedAsBuilder,
      pointsEarnedAsScout
    }
  });
}

export function mockUserAllTimeStats({
  userId,
  pointsEarnedAsBuilder = Math.floor(Math.random() * 1000),
  pointsEarnedAsScout = Math.floor(Math.random() * 1000)
}: {
  userId: string;
  pointsEarnedAsBuilder?: number;
  pointsEarnedAsScout?: number;
}) {
  return prisma.userAllTimeStats.create({
    data: {
      userId,
      pointsEarnedAsBuilder,
      pointsEarnedAsScout
    }
  });
}

export function mockUserWeeklyStats({
  gemsCollected = Math.floor(Math.random() * 100),
  rank,
  userId,
  week = getCurrentWeek(),
  season = mockSeason
}: {
  gemsCollected?: number;
  rank?: number;
  userId: string;
  week?: string;
  season?: string;
}) {
  return prisma.userWeeklyStats.create({
    data: {
      userId,
      gemsCollected,
      rank,
      week,
      season
    }
  });
}

export async function mockScoutProject({
  name = 'Test Project',
  userId,
  memberIds = [],
  deployerAddress,
  contracts = [],
  wallets = []
}: {
  name?: string;
  userId?: string;
  memberIds?: string[];
  deployerAddress?: string;
  contracts?: ({ chainId?: number; address: string } | string)[];
  wallets?: ({ chainId?: number; address: string } | string)[];
}) {
  const path = randomString();
  const createdBy = userId ?? (await mockScout()).id;

  // always set deployerAddress if contract addresses are provided
  deployerAddress = deployerAddress || (contracts.length ? '0x1234' : undefined);

  const scoutProject = await prisma.scoutProject.create({
    data: {
      name,
      path,
      avatar: 'https://placehold.co/600x400',
      description: 'Test description',
      website: 'https://test.com',
      github: `https://github.com/test-${Math.random().toString(36).substring(2, 15)}`,
      deployers: deployerAddress
        ? {
            create: {
              address: deployerAddress,
              verifiedAt: new Date()
            }
          }
        : undefined,
      members: {
        createMany: {
          data: [
            {
              userId: createdBy,
              role: 'owner',
              createdBy
            },
            ...memberIds.map((memberId) => ({
              userId: memberId,
              role: 'member' as ScoutProjectMemberRole,
              createdBy
            }))
          ]
        }
      },
      wallets: {
        createMany: {
          data: wallets.map((wallet) => {
            const chainId = 'chainId' in (wallet as object) ? (wallet as { chainId: number }).chainId : 1;
            const address = typeof wallet === 'string' ? wallet : (wallet as { address: string }).address;
            return { address, chainId, createdBy, chainType: 'evm' };
          })
        }
      }
    },
    include: {
      deployers: true,
      members: true,
      wallets: true
    }
  });

  const deployer = scoutProject.deployers[0];
  let _contracts: ScoutProjectContract[] = [];
  if (contracts.length && deployer) {
    await prisma.scoutProjectContract.createMany({
      data: contracts.map((contract) => {
        const chainId = (contract as { chainId?: number }).chainId || 1;
        const address = typeof contract === 'string' ? contract : contract.address;
        return {
          address,
          chainId,
          projectId: scoutProject.id,
          deployerId: deployer.id,
          deployTxHash: `0x${Math.random().toString(16).substring(2)}`,
          deployedAt: new Date(),
          createdBy,
          blockNumber: 1
        };
      })
    });
    _contracts = await prisma.scoutProjectContract.findMany({
      where: {
        projectId: scoutProject.id
      }
    });
  }

  return {
    ...scoutProject,
    contracts: _contracts
  };
}

export async function mockWeeklyClaims({ week, season }: { week: string; season: string }) {
  return prisma.weeklyClaims.create({
    data: {
      week,
      season,
      claims: [],
      proofsMap: {},
      totalClaimable: 0,
      merkleTreeRoot: ''
    }
  });
}

export async function mockPartnerRewardPayoutContract({ scoutId }: { scoutId: string }) {
  const scoutWallet = await prisma.scoutWallet.findFirstOrThrow({ where: { scoutId } });

  return prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: 1,
      contractAddress: randomWalletAddress(),
      ipfsCid: randomString(),
      merkleTreeJson: {
        root: '0x1',
        recipients: [
          {
            address: scoutWallet.address.toLowerCase() as `0x${string}`,
            amount: '100'
          }
        ]
      },
      deployTxHash: `0x${Math.random().toString(16).substring(2)}`,
      season: mockSeason,
      week: getCurrentWeek(),
      tokenAddress: randomWalletAddress(),
      tokenDecimals: 18,
      tokenSymbol: 'TEST',
      partner: 'Test Partner',
      rewardPayouts: {
        create: {
          amount: '100',
          walletAddress: scoutWallet.address.toLowerCase()
        }
      }
    },
    include: {
      rewardPayouts: true
    }
  });
}
