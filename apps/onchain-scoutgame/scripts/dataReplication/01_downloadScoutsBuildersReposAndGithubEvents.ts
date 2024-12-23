import { prisma } from "@charmverse/core/prisma-client";
import { currentSeason } from "@packages/scoutgame/dates";
import fs from "node:fs/promises";

// Team member profile paths
const profilePaths = [
  'val3ntin.eth',
  'safwan',
  'meb',
  'alexpoon.eth',
  'mattcasey',
  'ccarella.eth'
]

// Run this against the production database
async function downloadScoutsBuildersReposAndGithubEvents() {
  const builders = await prisma.scout.findMany({
    where: {
      builderNfts: {
        some: {
          season: currentSeason,
          nftType: 'default'
        }
      },
      githubUsers: {
        some: {}
      }
    },
    include: {
      builderNfts: {
        where: {
          season: currentSeason,
          nftType: 'default'
        }
      },
      githubUsers: true,
    }
  });


  // Only get repos that have a merged pull request
  const repos = await prisma.githubRepo.findMany({
    where: {
      events: {
        some: {
          builderEvent: {
            type: 'merged_pull_request'
          }
        }
      }
    }
  });

  const scouts = await prisma.scout.findMany({
    where: {
      path: {
        in: profilePaths
      }
    },
    select: {
      id: true,
      createdAt: true,
      path: true,
      displayName: true,
      wallets: {
        select: {
          address: true,
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 1
      },
      farcasterId: true,
      farcasterName: true,
    }
  });

  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      repoId: {
        in: repos.map(repo => repo.id)
      },
      createdBy: {
        in: builders.map(builder => builder.githubUsers[0].id)
      }
    },
    include: {
      strike: true
    }
  });

  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      builderId: {
        in: builders.map(builder => builder.id)
      },
      type: {
        in: ['daily_commit', 'merged_pull_request']
      },
      gemsReceipt: {
        isNot: null
      }
    },
    include: {
      gemsReceipt: true
    }
  });

  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/builderEvents.ts', `export const builderEvents = ${JSON.stringify(builderEvents, null, 2)} as const;`);
  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/githubEvents.ts', `export const githubEvents = ${JSON.stringify(githubEvents, null, 2)} as const;`);
  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/scouts.ts', `export const scouts = ${JSON.stringify(scouts, null, 2)} as const;`);
  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/builders.ts', `export const builders = ${JSON.stringify(builders, null, 2)} as const;`);
  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/repos.ts', `export const repos = ${JSON.stringify(repos, null, 2)} as const;`);
}

downloadScoutsBuildersReposAndGithubEvents();