import { prisma } from '@charmverse/core/prisma-client';
import { writeFile } from 'fs/promises';
import { DateTime } from 'luxon';

async function query() {
  const repos = await prisma.githubRepo.findMany({
    where: {
      ownerType: 'org',
      deletedAt: null
    },
    orderBy: [
      {
        owner: 'asc'
      },
      {
        name: 'asc'
      }
    ]
  });

  // create a CSV with columns for owner and repo. include header row.
  const csv = repos.map((repo) => `${repo.owner},https://github.com/${repo.owner}/${repo.name}`).join('\n');
  await writeFile('repos.csv', `owner,url\n${csv}`);
}

query();
