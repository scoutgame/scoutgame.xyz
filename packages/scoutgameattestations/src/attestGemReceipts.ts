import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { capitalize } from '@packages/utils/strings';

import { multiAttestOnchain, type ScoutGameAttestationInput } from './attestOnchain';
import { scoutGameAttestationChainId, scoutGameContributionReceiptSchemaUid } from './constants';
import { createOrGetUserProfileAttestation } from './createOrGetUserProfileAttestation';
import { encodeContributionReceiptAttestation } from './easSchemas/index';
import { attestationLogger } from './logger';
import { uploadContributionReceiptToS3 } from './uploadContributionReceiptToS3';

const minimumGemsDate = new Date('2024-11-04T00:00:00Z');

function getDescription(ev: {
  type: string;
  event: {
    onchainAchievement?: { project?: { name: string }; tier: string } | null;
  };
}) {
  if (ev.type === 'onchain_achievement') {
    return `Project ${ev.event.onchainAchievement?.project?.name} reached ${capitalize(ev.event.onchainAchievement?.tier)} tier`;
  }
  return ev.type === 'daily_commit'
    ? `Contributed a regular commit to the repository`
    : ev.type === 'first_pr'
      ? 'First pull request in the repository'
      : ev.type === 'regular_pr'
        ? 'Authored pull request in the repository'
        : ev.type === 'third_pr_in_streak'
          ? 'Third pull request in a streak'
          : '';
}

function getUrl(ev: {
  type: string;
  event: {
    onchainAchievement?: { project?: { path: string } } | null;
    githubEvent?: {
      repo: { owner: string; name: string };
      commitHash: string | null;
      pullRequestNumber: number | null;
    } | null;
  };
}) {
  if (ev.type === 'onchain_achievement') {
    return `https://scoutgame.xyz/p/${ev.event.onchainAchievement?.project?.path}`;
  }
  if (ev.type === 'daily_commit') {
    return `https://github.com/${ev.event.githubEvent?.repo.owner}/${ev.event.githubEvent?.repo.name}/commit/${ev.event.githubEvent?.commitHash}`;
  }
  return `https://github.com/${ev.event.githubEvent?.repo.owner}/${ev.event.githubEvent?.repo.name}/pull/${ev.event.githubEvent?.pullRequestNumber}`;
}

export async function attestGemReceipts(): Promise<void> {
  const gemsReceiptQuery = {
    createdAt: {
      gte: minimumGemsDate
    },
    event: {
      type: {
        in: ['daily_commit', 'merged_pull_request', 'onchain_achievement']
      }
    },
    OR: [
      {
        onchainAttestationUid: null
      },
      {
        onchainChainId: {
          not: scoutGameAttestationChainId
        }
      }
    ]
  } satisfies Prisma.GemsReceiptWhereInput;

  const usersWithoutProfile = await prisma.scout.findMany({
    where: {
      onchainProfileAttestationUid: null,
      events: {
        some: {
          gemsReceipt: gemsReceiptQuery
        }
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true
    }
  });

  const usersToProcess = usersWithoutProfile.length;

  for (let i = 0; i < usersToProcess; i++) {
    const user = usersWithoutProfile[i];
    attestationLogger.info(`Populating profile attestation for user ${user.id} ${i + 1} / ${usersToProcess}`);

    await createOrGetUserProfileAttestation({ scoutId: user.id });
  }

  const gemReceiptsWithoutAttestation = await prisma.gemsReceipt.findMany({
    where: gemsReceiptQuery,
    select: {
      id: true,
      type: true,
      value: true,
      event: {
        select: {
          builder: {
            select: {
              id: true,
              onchainProfileAttestationUid: true
            }
          },
          onchainAchievement: {
            select: {
              tier: true,
              project: {
                select: {
                  name: true,
                  path: true
                }
              }
            }
          },
          githubEvent: {
            select: {
              commitHash: true,
              pullRequestNumber: true,
              repo: {
                select: {
                  id: true,
                  owner: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  const attestationInputs: Omit<ScoutGameAttestationInput, 'schemaId' | 'chainId'>[] = [];

  for (const ev of gemReceiptsWithoutAttestation) {
    try {
      const { metadataUrl } = await uploadContributionReceiptToS3({
        scoutId: ev.event.builder.id,
        gemReceiptId: ev.id,
        metadata: {
          description: getDescription(ev)
        }
      });

      attestationInputs.push({
        refUID: ev.event.builder.onchainProfileAttestationUid as `0x${string}`,
        data: encodeContributionReceiptAttestation({
          value: ev.value,
          type: ev.type,
          metadataUrl,
          description: getDescription(ev),
          url: getUrl(ev)
        })
      });
    } catch (error) {
      attestationLogger.error(`Error uploading contribution receipt to S3`, { error, gemReceiptId: ev.id });
    }
  }

  await multiAttestOnchain({
    chainId: scoutGameAttestationChainId,
    schemaId: scoutGameContributionReceiptSchemaUid(),
    records: attestationInputs,
    onAttestSuccess: async ({ attestationUid, index }) => {
      const event = gemReceiptsWithoutAttestation[index];

      await prisma.gemsReceipt.update({
        where: {
          id: event.id
        },
        data: {
          onchainChainId: scoutGameAttestationChainId,
          onchainAttestationUid: attestationUid
        }
      });
    }
  });

  attestationLogger.info(`Attested ${attestationInputs.length} gem receipts`);
}
