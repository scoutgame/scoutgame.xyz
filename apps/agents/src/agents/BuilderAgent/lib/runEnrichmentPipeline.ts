import fs from 'node:fs/promises';
import path from 'node:path';

import { log } from '@charmverse/core/log';

import type { Repository } from '../tools/searchRepos/searchReposTool';

import { processRepo } from './enrichRepoData';

async function runEnrichmentPipeline() {
  const reposPath = path.resolve('apps/agents/src/agents/BuilderAgent/tools/searchRepos/repos.json');

  const repos = JSON.parse(await fs.readFile(reposPath, 'utf-8')) as Repository[];
  const processingTimes: number[] = [];

  for (let i = 0; i < repos.length; i += 5) {
    const batchStart = Date.now();
    const batch = repos.slice(i, i + 5);

    try {
      // Process batch of repos concurrently
      const results = await Promise.all(
        batch.map(async (repo) => {
          try {
            const iterationStart = Date.now();
            await processRepo({ repoOwner: repo.owner, repoName: repo.name });
            return Date.now() - iterationStart;
          } catch (error) {
            log.error(`Error processing repo ${repo.owner}/${repo.name}:`, error);
            return 0;
          }
        })
      );

      // Filter out failed attempts (0ms processing time) and add successful times
      const validTimes = results.filter((time) => time > 0);
      processingTimes.push(...validTimes);

      const batchTime = Date.now() - batchStart;

      if (validTimes.length > 0) {
        // Calculate average time and estimate remaining time
        const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        const remainingItems = repos.length - (i + batch.length);
        const estimatedTimeRemaining = (avgTime / 5) * remainingItems; // Adjust for parallel processing

        log.info('/////////////////////////////////');
        log.info(`Processed batch ${i / 5 + 1} (${i + batch.length}/${repos.length} repos)`);
        log.info(`Batch processing time: ${(batchTime / 1000).toFixed(2)}s`);
        log.info(`Average processing time per batch: ${(avgTime / 1000).toFixed(2)}s`);
        log.info(`Estimated time remaining: ${(estimatedTimeRemaining / 1000 / 60).toFixed(2)} minutes`);
        log.info('/////////////////////////////////');
      } else {
        log.info('/////////////////////////////////');
        log.info(`Batch ${i / 5 + 1} already processed (${i + batch.length}/${repos.length} repos)`);
        log.info('/////////////////////////////////');
      }
    } catch (error) {
      log.error(`Error processing batch starting at index ${i}:`, error);
    }
  }
}

// runEnrichmentPipeline().then(console.log);
