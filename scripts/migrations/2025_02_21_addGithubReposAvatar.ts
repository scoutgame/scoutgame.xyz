import { GithubRepo, prisma } from '@charmverse/core/prisma-client';
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

export async function processBatch(
  items: Pick<GithubRepo, 'id' | 'owner' | 'name'>[],
  batchSize: number,
  processItem: (item: Pick<GithubRepo, 'id' | 'owner' | 'name'>) => Promise<string>,
  delayMs: number = 1000
): Promise<{id: number, avatar: string}[]> {
  const results: {id: number, avatar: string}[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(item => processItem(item).then(avatar => ({id: item.id, avatar})).catch(error => {
      log.error(`Error processing item ${item.id}: ${item.owner}/${item.name}`, {
        error
      });
      return null;
    })));
    results.push(...batchResults.filter(isTruthy));

    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

async function addGithubReposAvatar() {
  const githubRepos = await prisma.githubRepo.findMany({
    take: 1,
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

    log.info(`Processed batch ${batchNumber + 1} of ${totalBatches} github repos`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

addGithubReposAvatar();
