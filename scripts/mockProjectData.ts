import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { mockScoutProject } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

const builderDisplayName = 'mattcasey.eth';

// use this script to set up some mock projects for testing in a local environment

async function query() {
  const builder = await prisma.scout.findFirst({
    where: {
      displayName: builderDisplayName
    }
  });
  await prisma.scout.update({
    where: {
      id: builder!.id
    },
    data: {
      builderStatus: 'approved'
    }
  });
  // Create a test project with these builders as members
  const project = await mockScoutProject({
    userId: builder!.id,
    // Add a contract so we can add daily stats to it
    contracts: [randomWalletAddress()]
  });

  const contract = project.contracts[0];

  // Add daily stats with transactions in the bronze range (1-199)
  await prisma.scoutProjectContractDailyStats.create({
    data: {
      contractId: contract!.id,
      day: DateTime.now().minus({ days: 3 }).startOf('day').toJSDate(),
      week: getCurrentWeek(),
      transactions: 20, // Bronze tier (1-199)
      accounts: 5,
      gasFees: '100'
    }
  });

  // Add daily stats with transactions in the bronze range (1-199)
  await prisma.scoutProjectContractDailyStats.create({
    data: {
      contractId: contract!.id,
      day: DateTime.now().minus({ days: 1 }).startOf('day').toJSDate(),
      week: getCurrentWeek(),
      transactions: 10, // Bronze tier (1-199)
      accounts: 5,
      gasFees: '100'
    }
  });
  await prisma.scoutProjectContractDailyStats.create({
    data: {
      contractId: contract!.id,
      day: DateTime.now().minus({ days: 2 }).startOf('day').toJSDate(),
      week: getCurrentWeek(),
      transactions: 50, // Bronze tier (1-199)
      accounts: 5,
      gasFees: '100'
    }
  });
}

query();
