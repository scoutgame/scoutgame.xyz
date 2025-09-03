import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft, mockRepo, mockScout } from '@packages/testing/database';
import { randomLargeInt } from '@packages/testing/generators';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockPullRequest } from '../../../testing/generators';
import { gemsValues } from '../config';

const currentSeason = '2024-W40';

jest.unstable_mockModule('../github/getRecentMergedPullRequestsByUser', () => ({
  getRecentMergedPullRequestsByUser: jest.fn()
}));

const { recordMergedPullRequest } = await import('../recordMergedPullRequest');
const { getRecentMergedPullRequestsByUser } = await import('../github/getRecentMergedPullRequestsByUser');

describe('recordMergedPullRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create builder events and gems receipts for a first merged pull request', async () => {
    const repoId = randomLargeInt();
    const username = v4();

    const mockWeek = currentSeason;
    const eventDate = DateTime.fromISO(`${mockWeek}-1`, { zone: 'utc' }).toJSDate();

    const builder = await mockBuilder();
    const scout = await mockScout();

    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const repo = await mockRepo({
      id: repoId,
      owner: username,
      name: 'Test-Repo',
      defaultBranch: 'main'
    });

    const pullRequest = mockPullRequest({
      mergedAt: eventDate.toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    const result = await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    expect(result?.builderEvent).toBeTruthy();
    expect(result?.githubEvent).toBeTruthy();

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: builder.githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
      }
    });

    expect(builderEvents).toHaveLength(1);
    expect(builderEvents[0]?.week).toBe(mockWeek);

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        eventId: builderEvents[0]?.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_first_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });

    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_first_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });

    expect(scoutActivities).toBe(1);
  });

  it('should register a partner bonus', async () => {
    const scoutPartnerId = v4();

    // Create the scout partner first
    await prisma.scoutPartner.create({
      data: {
        id: scoutPartnerId,
        status: 'active',
        name: 'Test Partner',
        icon: 'test-icon.png',
        bannerImage: 'test-banner.png',
        infoPageImage: 'test-info.png'
      }
    });

    const builder = await mockBuilder();

    const repo = await mockRepo({
      scoutPartnerId,
      name: 'Test-Repo',
      defaultBranch: 'main'
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
      }
    });
    expect(builderEvent).toEqual(expect.objectContaining({ scoutPartnerId }));
  });

  it('should only give 2 points for a PR with no review', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequests = [
      mockPullRequest({
        mergedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo
      }),
      mockPullRequest({
        mergedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    ];

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest: pullRequests[0], repo, season: currentSeason });
    await recordMergedPullRequest({ pullRequest: pullRequests[1], repo, season: currentSeason });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts).toHaveLength(2);
    expect(gemsReceipts[0].type).toBe('first_pr');
    expect(gemsReceipts[0].value).toBe(gemsValues.first_pr);
    expect(gemsReceipts[1].type).toBe('regular_pr_unreviewed');
    expect(gemsReceipts[1].value).toBe(gemsValues.regular_pr_unreviewed);
  });

  it('should give 10 points for the first PR of the day with no review, per repo', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();
    const repo2 = await mockRepo();

    const pullRequests = [
      mockPullRequest({
        mergedAt: DateTime.utc().minus({ days: 2 }).toISO(),
        createdAt: DateTime.utc().minus({ days: 2 }).toISO(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo
      }),
      mockPullRequest({
        mergedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo
      }),
      // the next two are the same as the first two except for the repo
      mockPullRequest({
        mergedAt: DateTime.utc().minus({ days: 10 }).toISO(),
        createdAt: DateTime.utc().minus({ days: 10 }).toISO(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo: repo2
      }),
      mockPullRequest({
        mergedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        reviewDecision: null,
        state: 'MERGED',
        author: builder.githubUser,
        repo: repo2
      })
    ];

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest: pullRequests[0], repo, season: currentSeason });
    await recordMergedPullRequest({ pullRequest: pullRequests[1], repo, season: currentSeason });
    await recordMergedPullRequest({ pullRequest: pullRequests[2], repo: repo2, season: currentSeason });
    await recordMergedPullRequest({ pullRequest: pullRequests[3], repo: repo2, season: currentSeason });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts).toHaveLength(4);
    expect(gemsReceipts[0].type).toBe('first_pr');
    expect(gemsReceipts[0].value).toBe(gemsValues.first_pr);
    expect(gemsReceipts[1].type).toBe('first_pr');
    expect(gemsReceipts[1].value).toBe(gemsValues.first_pr);
    expect(gemsReceipts[2].type).toBe('regular_pr_unreviewed');
    expect(gemsReceipts[2].value).toBe(gemsValues.regular_pr);
    expect(gemsReceipts[3].type).toBe('regular_pr_unreviewed');
    expect(gemsReceipts[3].value).toBe(gemsValues.regular_pr);
  });

  it('should create builder events and gems receipts for a regular merged pull request', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });

    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: builder.githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        eventId: builderEvent?.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_regular_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_regular_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should create builder events and gems receipts for a 3 merged PR streak', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      mergedAt: now.minus({ days: 4 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.mergedAt!, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      mergedAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo, season: currentSeason, now });

    const pullRequest3 = mockPullRequest({
      mergedAt: now.toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest3, repo, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(3);

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        type: 'third_pr_in_streak'
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_third_pr_in_streak',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_third_pr_in_streak',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('each PR in a streak does not have to be adjacent', async () => {
    const builder = await mockBuilder({ createNft: true });
    const repo = await mockRepo();

    // pick a static day-of-week for stability
    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const mergedAts = [now.minus({ days: 5 }), now.minus({ days: 4 }), now.minus({ days: 2 })];
    const prs = mergedAts.map((mergedAt) =>
      mockPullRequest({
        mergedAt: mergedAt.toISO(),
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    );

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);
    for (const pullRequest of prs) {
      await recordMergedPullRequest({ pullRequest, repo, season: currentSeason, now });
    }

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts.map((r) => r.type)).toEqual(['regular_pr', 'regular_pr', 'third_pr_in_streak']);
  });

  it('each PR in a streak should occur on a different day', async () => {
    const builder = await mockBuilder({ createNft: true });
    const repo = await mockRepo();

    // pick a static day-of-week for stability
    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const mergedAts = [now.minus({ days: 4 }), now.minus({ days: 4 }), now.minus({ days: 2 })];
    const prs = mergedAts.map((mergedAt) =>
      mockPullRequest({
        mergedAt: mergedAt.toISO(),
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    );

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);
    for (const pullRequest of prs) {
      await recordMergedPullRequest({ pullRequest, repo, season: currentSeason, now });
    }

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts.map((r) => r.type)).toEqual(['regular_pr', 'regular_pr', 'regular_pr']);
  });

  it('each PR in a streak should occur on a different day, including the latest', async () => {
    const builder = await mockBuilder({ createNft: true });
    const repo = await mockRepo();

    // pick a static day-of-week for stability
    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const mergedAts = [now.minus({ days: 4 }), now.minus({ days: 2 }), now.minus({ days: 2 })];
    const prs = mergedAts.map((mergedAt) =>
      mockPullRequest({
        mergedAt: mergedAt.toISO(),
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    );

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);
    for (const pullRequest of prs) {
      await recordMergedPullRequest({ pullRequest, repo, season: currentSeason, now });
    }

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts.map((r) => r.type)).toEqual(['regular_pr', 'regular_pr', 'regular_pr']);
  });

  it('the PR after a streak should be a regular PR', async () => {
    const builder = await mockBuilder({ createNft: true });
    const repo = await mockRepo();

    // pick a static day-of-week for stability
    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const mergedAts = [now.minus({ days: 4 }), now.minus({ days: 3 }), now.minus({ days: 2 }), now.minus({ days: 1 })];
    const prs = mergedAts.map((mergedAt) =>
      mockPullRequest({
        mergedAt: mergedAt.toISO(),
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    );

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);
    for (const pullRequest of prs) {
      await recordMergedPullRequest({ pullRequest, repo, season: currentSeason, now });
    }

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts.map((r) => r.type)).toEqual(['regular_pr', 'regular_pr', 'third_pr_in_streak', 'regular_pr']);
  });

  // We only grab events from the last 7 days, so what looked like a streak may change over time
  it('Handles streaks that started with events prior to the 7 day window', async () => {
    const builder = await mockBuilder({ createNft: true });
    const repo = await mockRepo();

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    // mergedAt should include a date outside the 7 day window
    const mergedAts = [8, 4, 2, 0];
    const prs = mergedAts.map((daysAgo) =>
      mockPullRequest({
        mergedAt: now.minus({ days: daysAgo }).toISO(),
        state: 'MERGED',
        author: builder.githubUser,
        repo
      })
    );

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);
    for (const pullRequest of prs) {
      await recordMergedPullRequest({ pullRequest, repo, season: currentSeason, now });
    }

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect(gemsReceipts.map((r) => r.type)).toEqual(['regular_pr', 'regular_pr', 'third_pr_in_streak', 'regular_pr']);
  });

  it('should allow creating multiple builder events per repo per day', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.createdAt, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(2);
  });

  it('should create two builder events on the same day for different repos', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const repo2 = await mockRepo();

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.createdAt, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo: repo2,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo: repo2, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(2);
  });

  it('should not create builder events and gems receipts for existing events', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: 'utc' }).minus({ days: 3 }).toISO(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });
    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
      }
    });
    expect(builderEvents).toBe(1);

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(1);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        gemsReceiptId: gemsReceipts[0].id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        gemsReceiptId: gemsReceipts[0].id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should not create builder events for banned builders', async () => {
    const builder = await mockBuilder({
      builderStatus: 'banned'
    });
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: 'utc' }).minus({ days: 3 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentMergedPullRequestsByUser as jest.Mock<typeof getRecentMergedPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
      }
    });
    expect(builderEvents).toHaveLength(0);

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(0);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(0);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(0);
  });
});
