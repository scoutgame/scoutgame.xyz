import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { mockBuilder, mockScoutProject } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { saveProjectAchievement } from '@packages/blockchain/analytics/saveProjectAchievement';
const builderDisplayName = 'mattcasey.eth';

// use this script to set up some mock projects for testing in a local environment

async function query() {
  const builder = await prisma.scout.findFirstOrThrow({
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

  const project1 = await mockScoutProjectWithFewTransactions(builder.id);
  console.log('Generated mock project with few transactions: http://localhost:3001/p/' + project1.path);
  const project2 = await mockScoutProjectWithManyTransactions(builder.id);
  console.log('Generated mock project with many transactions: http://localhost:3001/p/' + project2.path);
}

async function mockScoutProjectWithFewTransactions(userId: string) {
  const builder1 = await mockBuilder();
  const builder2 = await mockBuilder();
  const project = await mockScoutProject({
    userId: userId,
    memberIds: [builder1.id, builder2.id],
    contracts: [randomWalletAddress()]
  });
  const contract = project.contracts[0];

  // Add daily stats with transactions in the bronze range (1-199)
  const week = getCurrentWeek();
  await prisma.scoutProjectContractDailyStats.create({
    data: {
      contractId: contract!.id,
      day: DateTime.now().minus({ days: 3 }).startOf('day').toJSDate(),
      week,
      transactions: 20, // Bronze tier (1-199)
      accounts: 5,
      gasFees: '100'
    }
  });

  await saveProjectAchievement(
    {
      projectId: project.id,
      tier: 'bronze',
      builders: [userId, builder1.id, builder2.id].map((id) => ({
        builderId: id,
        gems: 4
      }))
    },
    week
  );
  return project;
}

async function mockScoutProjectWithManyTransactions(userId: string) {
  const builder1 = await mockBuilder();
  const project = await mockScoutProject({
    userId: userId,
    memberIds: [builder1.id],
    contracts: [randomWalletAddress(), randomWalletAddress()]
  });
  const contract = project.contracts[0];

  // Add daily stats with transactions in the bronze range (1-199)
  const week = getCurrentWeek();
  await prisma.scoutProjectContractDailyStats.create({
    data: {
      contractId: contract!.id,
      day: DateTime.now().minus({ days: 3 }).startOf('day').toJSDate(),
      week,
      transactions: 20, // Bronze tier (1-199)
      accounts: 5,
      gasFees: '100'
    }
  });

  let today = DateTime.utc().startOf('day');
  for (let i = 0; i < 20; i++) {
    // Add daily stats with transactions in the bronze range (1-199)
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId: contract!.id,
        day: today.startOf('day').toJSDate(),
        week: getCurrentWeek(today.toJSDate()),
        transactions: Math.floor(Math.random() * 100),
        accounts: 5,
        gasFees: '100'
      }
    });
    today = today.minus({ days: 1 });
  }

  await saveProjectAchievement(
    {
      projectId: project.id,
      tier: 'bronze',
      builders: [userId, builder1.id].map((id) => ({
        builderId: id,
        gems: 4
      }))
    },
    week
  );
  await saveProjectAchievement(
    {
      projectId: project.id,
      tier: 'silver',
      builders: [userId, builder1.id].map((id) => ({
        builderId: id,
        gems: 4
      }))
    },
    week
  );
  await saveProjectAchievement(
    {
      projectId: project.id,
      tier: 'gold',
      builders: [userId, builder1.id].map((id) => ({
        builderId: id,
        gems: 20
      }))
    },
    week
  );
  return project;
}

query().catch(console.error);
