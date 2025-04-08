import { prisma } from '@charmverse/core/prisma-client';
import type { jest } from '@jest/globals';
import { getCurrentWeek, getNextWeek } from '@packages/dates/utils';
import {
  mockBuilder,
  mockScout,
  mockPullRequestBuilderEvent,
  mockRepo,
  mockMatchup,
  mockBuilderEvent
} from '@packages/testing/database';

import { getMyMatchupResults } from '../getMyMatchupResults';

describe('getMyMatchupResults', () => {
  const mockWeek = getCurrentWeek();

  it('should return null when no scoutId is provided', async () => {
    const result = await getMyMatchupResults({ week: mockWeek });
    expect(result).toBeNull();
  });

  it('should return null when no matchup is found', async () => {
    // Create a scout
    const scout = await mockScout();

    const result = await getMyMatchupResults({ scoutId: scout.id, week: mockWeek });
    expect(result).toBeNull();
  });

  it('should correctly process events for merged pull requests, daily commits, and onchain achievements', async () => {
    // Create a matchup with a developer who has different types of events
    const scout = await mockScout();
    const builder = await mockBuilder();
    const { matchup } = await mockMatchup({ createdBy: scout.id, week: mockWeek, selectedDevelopers: [builder.id] });
    const repo = await mockRepo();
    const event = await mockPullRequestBuilderEvent({
      builderId: builder.id,
      repoId: repo.id,
      gemsValue: 10,
      gemsReceiptType: 'first_pr',
      week: mockWeek
    });
    await mockBuilderEvent({
      builderId: builder.id,
      createdAt: new Date(event.createdAt.getTime() + 1000 * 60 * 60 * 24),
      eventType: 'onchain_achievement',
      week: mockWeek,
      gemsValue: 15,
      gemsReceiptType: 'onchain_achievement'
    });

    const result = await getMyMatchupResults({ scoutId: scout.id, week: mockWeek });

    expect(result).not.toBeNull();
    expect(result?.developers).toHaveLength(1);
    expect(result?.developers[0].events).toHaveLength(2);
    expect(result?.id).toBe(matchup.id);

    // Check onchain achievement
    expect(result?.developers[0].events[0]).toEqual({
      createdAt: expect.any(String),
      gemsCollected: 15,
      url: '',
      repoFullName: '',
      contributionType: 'onchain_achievement'
    });

    // Check merged pull request
    expect(result?.developers[0].events[1]).toEqual(
      expect.objectContaining({
        createdAt: expect.any(String),
        gemsCollected: 10,
        repoFullName: `${repo.owner}/${repo.name}`,
        contributionType: 'first_pr'
      })
    );

    // Check total gems collected
    expect(result?.developers[0].totalGemsCollected).toBe(25);
    expect(result?.totalGemsCollected).toBe(25);
  });

  it('should filter events by the specified week', async () => {
    // Create a matchup with events from different weeks
    const scout = await mockScout();
    const builder = await mockBuilder();
    await mockMatchup({ createdBy: scout.id, week: mockWeek, selectedDevelopers: [builder.id] });
    const repo = await mockRepo();
    const event = await mockPullRequestBuilderEvent({
      builderId: builder.id,
      repoId: repo.id,
      gemsValue: 10,
      gemsReceiptType: 'first_pr',
      week: mockWeek
    });
    await mockBuilderEvent({
      builderId: builder.id,
      createdAt: new Date(event.createdAt.getTime() + 1000 * 60 * 60 * 24),
      eventType: 'onchain_achievement',
      week: getNextWeek(mockWeek),
      gemsValue: 15,
      gemsReceiptType: 'onchain_achievement'
    });

    const result = await getMyMatchupResults({ scoutId: scout.id, week: mockWeek });

    expect(result).not.toBeNull();
    expect(result?.developers[0].events).toHaveLength(1); // Only events within the week
  });
});
