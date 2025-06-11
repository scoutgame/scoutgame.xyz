import { processOnchainGemsPayout } from '../apps/cron/src/tasks/processOnchainGemsPayout';

async function query() {
  await processOnchainGemsPayout(null as any);
}

query();
