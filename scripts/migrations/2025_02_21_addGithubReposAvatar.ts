import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@charmverse/core/log';
import { isTruthy } from '@packages/utils/types';

export async function getOwnerAvatar(owner: string): Promise<string> {
  const response = await fetch(`https://api.github.com/users/${owner}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.avatar_url;
}

async function addGithubReposAvatar() {
  const githubRepos = await prisma.githubRepo.findMany({
    where: {
      avatar: null
    },
    orderBy: {
      id: 'asc'
    },
    select: {
      id: true,
      owner: true,
      name: true
    }
  });

  const total = githubRepos.length;
  log.info(`Processing ${total} github repos`);

  const batchSize = 10;
  const delayMs = 1000;
  const totalBatches = Math.ceil(total / batchSize);
  
  for (let batchNumber = 0; batchNumber < totalBatches; batchNumber += 1) {
    const batch = githubRepos.slice(batchNumber * batchSize, (batchNumber + 1) * batchSize);
    const githubAvatarResults = await Promise.all(batch.map(item => getOwnerAvatar(item.owner).then(avatar => ({id: item.id, avatar, owner: item.owner, name: item.name})).catch(error => {
      log.error(`Error fetching avatar for ${item.id}: ${item.owner}/${item.name}`, {
        error
      });
      return null;
    })));

    const results = githubAvatarResults.filter(isTruthy);

    await Promise.all(results.map(result => prisma.githubRepo.update({
      where: { id: result.id },
      data: { avatar: result.avatar }
    }).catch(error => {
      log.error(`Error updating avatar for ${result.id}: ${result.owner}/${result.name}`, {
        error
      });
    })));

    log.info(`Processed batch ${batchNumber + 1} of ${totalBatches} batches`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

addGithubReposAvatar();
