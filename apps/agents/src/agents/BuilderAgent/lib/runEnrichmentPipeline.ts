import fs from 'node:fs/promises';
import path from 'node:path';

import { log } from '@charmverse/core/log';

import type { Repository } from '../tools/searchRepos/searchReposTool';

import { processRepo } from './enrichRepoData';

async function runEnrichmentPipeline() {
  const reposPath = path.resolve('apps/agents/src/agents/BuilderAgent/tools/searchRepos/repos.json');

  const repos = JSON.parse(await fs.readFile(reposPath, 'utf-8')) as Repository[];
  const processingTimes: number[] = [];

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    const iterationStart = Date.now();

    await processRepo({ repoOwner: repo.owner, repoName: repo.name });

    const timeForIteration = Date.now() - iterationStart;
    processingTimes.push(timeForIteration);

    // Calculate average time and estimate remaining time
    const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const remainingItems = repos.length - (i + 1);
    const estimatedTimeRemaining = avgTime * remainingItems;

    log.info('/////////////////////////////////');
    log.info(`Processed ${i + 1}/${repos.length} repos`);
    log.info(`Average processing time: ${(avgTime / 1000).toFixed(2)}s`);
    log.info(`Estimated time remaining: ${(estimatedTimeRemaining / 1000 / 60).toFixed(2)} minutes`);
    log.info('/////////////////////////////////');
  }
}

runEnrichmentPipeline().then(console.log);
