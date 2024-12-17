import { prisma } from "@charmverse/core/prisma-client";
import { currentSeason } from "@packages/scoutgame/dates";
import fs from "node:fs/promises";

// Run this against the production database
async function downloadBuildersAndRepos() {
  const scouts = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        some: {
          season: currentSeason
        }
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

  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/scouts.ts', `export const scouts = ${JSON.stringify(scouts, null, 2)} as const;`);
  await fs.writeFile('apps/onchain-scoutgame/scripts/dataReplication/cache/repos.ts', `export const repos = ${JSON.stringify(repos, null, 2)} as const;`);
}

downloadBuildersAndRepos();