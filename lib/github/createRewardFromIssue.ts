import { prisma } from '@charmverse/core/prisma-client';
import type { IssuesLabeledEvent } from '@octokit/webhooks-types';

import { createReward } from 'lib/rewards/createReward';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer } from 'lib/rewards/interfaces';

export async function createRewardFromIssue({
  installationId,
  repositoryId,
  label,
  issueTitle,
  issueState,
  issueId
}: {
  issueId: string;
  installationId: string;
  repositoryId: string;
  label?: string;
  issueTitle: string;
  issueState: IssuesLabeledEvent['issue']['state'];
}) {
  const existingReward = await prisma.bounty.findFirst({
    where: {
      githubIssueId: issueId,
      githubRepoId: repositoryId
    }
  });

  if (existingReward) {
    return {
      success: true,
      message: 'Reward already created.'
    };
  }

  const spaceGithubConnection = await prisma.spaceGithubConnection.findFirst({
    where: {
      installationId
    },
    select: {
      spaceId: true,
      rewardsRepos: true
    }
  });

  if (!spaceGithubConnection) {
    return {
      success: true,
      message: 'Space not found or not connected to CharmVerse GitHub App.'
    };
  }

  if (spaceGithubConnection.rewardsRepos.length === 0) {
    return {
      success: true,
      message: 'Space not connected to any rewards repo.'
    };
  }

  if (issueState !== 'open') {
    return {
      success: true,
      message: 'Issue is not open.'
    };
  }

  const rewardsRepo = spaceGithubConnection.rewardsRepos[0];
  if (repositoryId !== rewardsRepo.repositoryId) {
    return {
      success: true,
      message: 'Repository is not the rewards repo.'
    };
  }

  const targetLabels = rewardsRepo.repositoryLabels;
  if (targetLabels.length !== 0 && (!label || !targetLabels.includes(label))) {
    if (!label) {
      return {
        success: true,
        message: 'Issue does not have a label.'
      };
    }

    return {
      success: true,
      message: 'Issue label does not match the rewards repo labels.'
    };
  }

  const templateId = rewardsRepo.rewardTemplateId;
  const rewardTemplate = templateId
    ? await prisma.bounty.findFirst({
        where: {
          page: {
            id: templateId,
            type: 'bounty_template'
          }
        },
        include: {
          permissions: true,
          page: true
        }
      })
    : null;

  const spaceId = spaceGithubConnection.spaceId;
  const userId = rewardTemplate?.createdBy ?? rewardsRepo.rewardAuthorId;

  const assignedSubmitters: string[] = [];
  const allowedSubmitterRoles: string[] = [];
  const reviewers: RewardReviewer[] = [];

  rewardTemplate?.permissions?.forEach((p) => {
    if (p.permissionLevel === 'submitter' && p.userId) {
      assignedSubmitters.push(p.userId);
    } else if (p.permissionLevel === 'reviewer') {
      reviewers.push({
        group: p.userId ? 'user' : 'role',
        id: (p.userId ?? p.roleId) as string
      });
    } else if (p.permissionLevel === 'submitter' && p.roleId) {
      allowedSubmitterRoles.push(p.roleId);
    }
  });

  await createReward({
    spaceId,
    userId,
    approveSubmitters: rewardTemplate?.approveSubmitters,
    allowMultipleApplications: rewardTemplate?.allowMultipleApplications,
    chainId: rewardTemplate?.chainId,
    customReward: rewardTemplate?.customReward,
    dueDate: rewardTemplate?.dueDate,
    fields: rewardTemplate?.fields,
    maxSubmissions: rewardTemplate?.maxSubmissions,
    rewardAmount: rewardTemplate?.rewardAmount,
    rewardToken: rewardTemplate?.rewardToken,
    rewardType: rewardTemplate ? getRewardType(rewardTemplate) : undefined,
    allowedSubmitterRoles: allowedSubmitterRoles.length > 0 ? allowedSubmitterRoles : undefined,
    assignedSubmitters: assignedSubmitters.length > 0 ? assignedSubmitters : undefined,
    reviewers:
      reviewers.length > 0
        ? reviewers
        : [
            {
              group: 'user',
              id: rewardsRepo.rewardAuthorId
            }
          ],
    githubIssueId: issueId,
    githubRepoId: repositoryId,
    pageProps: {
      autoGenerated: true,
      ...rewardTemplate?.page,
      type: 'bounty',
      title: issueTitle
    }
  });

  return {
    spaceIds: [spaceGithubConnection.spaceId],
    success: true,
    message: 'Reward created.'
  };
}
