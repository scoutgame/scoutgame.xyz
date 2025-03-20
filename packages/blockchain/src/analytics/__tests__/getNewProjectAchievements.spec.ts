import { prisma } from '@charmverse/core/prisma-client';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getCurrentSeason } from '@packages/dates/utils';
import { mockBuilder, mockScoutProject } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

import type { ProjectAchievement } from '../getNewProjectAchievements';

// Mock the getCurrentSeason module using jest.unstable_mockModule
jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentSeason: jest.fn().mockReturnValue({ start: '2023-01-01' })
}));

// Import the functions to test
const { getNewProjectAchievements, tiers } = await import('../getNewProjectAchievements');
const { saveProjectAchievement } = await import('../saveProjectAchievement');

describe('getNewProjectAchievements', () => {
  const mockWeek = '2023-W01';
  let builderIds: string[] = [];

  // Setup: create a test project and builders before tests
  beforeAll(async () => {
    // Create test builders
    const builder1 = await mockBuilder({ displayName: 'Builder 1' });
    const builder2 = await mockBuilder({ displayName: 'Builder 2' });
    builderIds = [builder1.id, builder2.id];
  });

  // Clean up after tests
  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should return bronze achievement when transaction count is between 1 and 199', async () => {
    // Create a test project with these builders as members
    const project = await mockScoutProject({
      memberIds: builderIds,
      // Add a contract so we can add daily stats to it
      contracts: [randomWalletAddress()]
    });

    const contract = project.contracts[0];

    // Add daily stats with transactions in the bronze range (1-199)
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId: contract!.id,
        day: new Date(),
        week: mockWeek,
        transactions: 50, // Bronze tier (1-199)
        accounts: 5,
        gasFees: '100'
      }
    });

    // Act
    const achievements = await getNewProjectAchievements(project.id, mockWeek);

    // Assert
    expect(achievements).toHaveLength(1);
    expect(achievements[0].tier).toBe('bronze');
    expect(achievements[0].projectId).toBe(project.id);
    expect(achievements[0].builders).toBeDefined();
    expect(achievements[0].builders.length).toBe(builderIds.length);
    // The bronze tier gives 10 gems divided among builders (2 builders = 5 each)
    const totalGems = achievements[0].builders.reduce((sum, builder) => sum + builder.gems, 0);
    expect(totalGems).toBeLessThanOrEqual(tiers.bronze.gems);
  });

  it('should return silver achievement when transaction count is between 200 and 1799', async () => {
    // Create a test project with these builders as members
    const project = await mockScoutProject({
      memberIds: builderIds,
      // Add a contract so we can add daily stats to it
      contracts: [randomWalletAddress()]
    });
    const projectId = project.id;
    const contractId = project.contracts[0].id;

    // Add daily stats with transactions in the silver range (200-1799)
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId,
        day: new Date(),
        week: mockWeek,
        transactions: 500, // Silver tier (200-1799)
        accounts: 10,
        gasFees: '0.5'
      }
    });

    // Act
    const achievements = await getNewProjectAchievements(projectId, mockWeek);

    // Assert
    expect(achievements).toHaveLength(2);
    expect(achievements[0].tier).toBe('bronze');
    expect(achievements[0].projectId).toBe(projectId);
    expect(achievements[1].tier).toBe('silver');
    expect(achievements[1].projectId).toBe(projectId);
    // The silver tier gives 50 gems divided among builders (2 builders = 25 each)
    const totalGems = achievements[1].builders.reduce((sum, builder) => sum + builder.gems, 0);
    expect(totalGems).toBeLessThanOrEqual(tiers.silver.gems);
  });

  it('should return gold achievement when transaction count is 1800 or more', async () => {
    // Create a test project with these builders as members
    const project = await mockScoutProject({
      memberIds: builderIds,
      // Add a contract so we can add daily stats to it
      contracts: [randomWalletAddress()]
    });
    const projectId = project.id;
    const contractId = project.contracts[0].id;

    // Add daily stats with transactions in the gold range (1800+)
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId,
        day: new Date(),
        week: mockWeek,
        transactions: 2000, // Gold tier (1800+)
        accounts: 15,
        gasFees: '1.0'
      }
    });

    // Act
    const achievements = await getNewProjectAchievements(projectId, mockWeek);

    // Assert
    expect(achievements).toHaveLength(3);
    expect(achievements[0].tier).toBe('bronze');
    expect(achievements[0].projectId).toBe(projectId);
    expect(achievements[1].tier).toBe('silver');
    expect(achievements[1].projectId).toBe(projectId);
    expect(achievements[2].tier).toBe('gold');
    expect(achievements[2].projectId).toBe(projectId);
    // The gold tier gives 100 gems divided among builders (2 builders = 50 each)
    const totalGems = achievements[2].builders.reduce((sum, builder) => sum + builder.gems, 0);
    expect(totalGems).toBeLessThanOrEqual(tiers.gold.gems);
  });

  it('should not return achievements for tiers that already exist', async () => {
    // Create a test project with these builders as members
    const project = await mockScoutProject({
      memberIds: builderIds,
      // Add a contract so we can add daily stats to it
      contracts: [randomWalletAddress()]
    });
    const projectId = project.id;
    const contractId = project.contracts[0].id;

    // Add daily stats with transactions in the silver range (200-1799)
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId,
        day: new Date(),
        week: mockWeek,
        transactions: 1500, // Silver tier (200-1799)
        accounts: 10,
        gasFees: '0.5'
      }
    });

    // Create existing bronze achievement
    await prisma.scoutProjectOnchainAchievement.create({
      data: {
        projectId,
        tier: 'bronze',
        week: mockWeek
      }
    });

    // Act
    const achievements = await getNewProjectAchievements(projectId, mockWeek);

    // Assert
    expect(achievements.find((a) => a.tier === 'bronze')).toBeUndefined();
    expect(achievements.find((a) => a.tier === 'silver')).toBeDefined();
  });
});

describe('saveProjectAchievement', () => {
  const mockWeek = '2023-01';

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should create a project achievement record in the database', async () => {
    const builder1 = await mockBuilder({ displayName: 'Builder 1' });
    const builder2 = await mockBuilder({ displayName: 'Builder 2' });
    const builderIds = [builder1.id, builder2.id];
    const project = await mockScoutProject({
      memberIds: builderIds,
      contracts: [randomWalletAddress()]
    });
    const projectId = project.id;
    const contractId = project.contracts[0].id;
    // Arrange
    const mockAchievement: ProjectAchievement = {
      projectId,
      tier: 'bronze',
      builders: [{ builderId: builderIds[0], gems: 1 }]
    };

    // Act
    await saveProjectAchievement(mockAchievement, mockWeek);

    // Assert
    // Since we're not mocking prisma, we need to verify the record was created
    const savedAchievement = await prisma.scoutProjectOnchainAchievement.findFirst({
      where: {
        projectId,
        tier: 'bronze',
        week: mockWeek
      }
    });

    // Verify the achievement record was created
    expect(savedAchievement).toBeDefined();

    // Query for builder events separately to avoid type issues
    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        type: 'onchain_achievement',
        week: mockWeek,
        builderId: builderIds[0]
      }
    });

    // Verify one builder event was created
    expect(builderEvents.length).toBe(1);

    // Check that gems were awarded by querying events with gemsReceipt
    const eventWithGems = await prisma.builderEvent.findFirst({
      where: {
        builderId: builderIds[0],
        type: 'onchain_achievement'
      },
      include: {
        gemsReceipt: true
      }
    });

    // Verify gems receipt was created
    expect(eventWithGems?.gemsReceipt?.value).toBeGreaterThan(0);
  });

  it('should create multiple builder events for projects with multiple members', async () => {
    const builder1 = await mockBuilder({ displayName: 'Builder 1' });
    const builder2 = await mockBuilder({ displayName: 'Builder 2' });
    const builderIds = [builder1.id, builder2.id];
    const project = await mockScoutProject({
      memberIds: builderIds,
      contracts: [randomWalletAddress()]
    });
    const projectId = project.id;
    const contractId = project.contracts[0].id;
    // Arrange
    const mockAchievement: ProjectAchievement = {
      projectId,
      tier: 'silver',
      builders: [
        { builderId: builderIds[0], gems: 25 },
        { builderId: builderIds[1], gems: 25 }
      ]
    };

    // Act
    await saveProjectAchievement(mockAchievement, mockWeek);

    // Assert
    const savedAchievement = await prisma.scoutProjectOnchainAchievement.findFirst({
      where: {
        projectId,
        tier: 'silver',
        week: mockWeek
      }
    });

    // Verify the achievement record was created
    expect(savedAchievement).toBeDefined();

    // Query for builder events separately
    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        type: 'onchain_achievement',
        week: mockWeek,
        builderId: { in: builderIds }
      }
    });

    // Verify two builder events were created (one for each builder)
    expect(builderEvents.length).toBe(2);

    // Verify each builder got an event
    expect(builderEvents.some((e) => e.builderId === builderIds[0])).toBeTruthy();
    expect(builderEvents.some((e) => e.builderId === builderIds[1])).toBeTruthy();

    // Check total gems awarded
    let totalGems = 0;
    for (const builderId of builderIds) {
      const eventWithGems = await prisma.builderEvent.findFirst({
        where: {
          builderId,
          type: 'onchain_achievement'
        },
        include: {
          gemsReceipt: true
        }
      });

      if (eventWithGems?.gemsReceipt) {
        totalGems += eventWithGems.gemsReceipt.value || 0;
      }
    }

    expect(totalGems).toBe(50); // 25 + 25 = 50 gems total for silver tier
  });
});
