import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import type { Season } from '@packages/dates/config';
import { mockRepo, mockBuilder } from '@packages/testing/database';
import { mockSeason } from '@packages/testing/generators';
import { DateTime } from 'luxon';

import { gemsValues } from '../config';

import { mockCommit, mockPullRequest } from '@/testing/generators';

jest.unstable_mockModule('@packages/github/getCommitsByUser', () => ({
  getCommitsByUser: jest.fn()
}));

jest.unstable_mockModule('@packages/github/getPullRequestsByUser', () => ({
  getPullRequestsByUser: jest.fn()
}));

// jest.unstable_mockModule('../recordMergedPullRequest', () => ({
//   recordMergedPullRequest: jest.fn()
// }));

// jest.unstable_mockModule('../recordCommit', () => ({
//   recordCommit: jest.fn()
// }));

jest.unstable_mockModule('../github/getRecentMergedPullRequestsByUser', () => ({
  getRecentMergedPullRequestsByUser: jest.fn()
}));
const { getRecentMergedPullRequestsByUser } = await import('../github/getRecentMergedPullRequestsByUser');

const { getCommitsByUser } = await import('@packages/github/getCommitsByUser');
const { getPullRequestsByUser } = await import('@packages/github/getPullRequestsByUser');
const { processDeveloperActivity } = await import('../processDeveloperActivity');
const { recordMergedPullRequest } = await import('../recordMergedPullRequest');
const { recordCommit } = await import('../recordCommit');
describe('processDeveloperActivity', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should retrieve pull requests and commits for a repo we track', async () => {
    const repo = await mockRepo();
    const builder = await mockBuilder();

    const commit = mockCommit({
      author: builder.githubUser,
      repo
    });
    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.local().minus({ days: 2 }).toISO(), // generate on a different day so that the commit gets counted
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);
    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await processDeveloperActivity({
      builderId: builder.id,
      githubUser: builder.githubUser,
      createdAfter: new Date(),
      season: mockSeason as Season
    });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        season: mockSeason,
        githubEvent: {
          isNot: null
        }
      }
    });

    expect(builderEvents).toEqual(2);

    const builderStats = await prisma.userWeeklyStats.findFirst({
      where: {
        userId: builder.id
      }
    });
    expect(builderStats).toBeDefined();
    expect(builderStats!.season).toBe(mockSeason);
    expect(builderStats!.gemsCollected).toBe(gemsValues.first_pr + gemsValues.daily_commit);
  });

  it('will record a commit even if a PR was recorded for the same sha', async () => {
    const repo = await mockRepo();
    const builder = await mockBuilder();

    const commit = mockCommit({
      author: builder.githubUser,
      repo
    });

    const pullRequest = mockPullRequest({
      sha: commit.sha,
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.local().minus({ days: 2 }).toISO(), // generate on a different day so that the commit gets counted
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);
    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await processDeveloperActivity({
      builderId: builder.id,
      githubUser: builder.githubUser,
      createdAfter: new Date(),
      season: mockSeason as Season
    });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        season: mockSeason,
        githubEvent: {
          isNot: null
        }
      }
    });

    expect(builderEvents).toEqual(2);

    const builderStats = await prisma.userWeeklyStats.findFirst({
      where: {
        userId: builder.id
      }
    });
    expect(builderStats).toBeDefined();
    expect(builderStats!.season).toBe(mockSeason);
    expect(builderStats!.gemsCollected).toBe(gemsValues.first_pr + gemsValues.daily_commit);
  });
});
