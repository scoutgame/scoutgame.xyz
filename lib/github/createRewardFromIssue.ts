import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { IssuesLabeledEvent, IssuesOpenedEvent } from '@octokit/webhooks-types';
import { baseUrl } from '@root/config/constants';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { createReward } from 'lib/rewards/createReward';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { relay } from 'lib/websockets/relay';

import { createOctokitApp } from './app';

export async function createRewardFromIssue({
  createIssueComment,
  message
}: {
  // Adding a flag to create issue comment so that it can be skipped in tests
  createIssueComment?: boolean;
  message: IssuesLabeledEvent | IssuesOpenedEvent;
}) {
  const installationId = message.installation?.id?.toString();

  if (!installationId) {
    return {
      success: false,
      message: 'Missing installation ID.'
    };
  }

  const issueState = message.issue?.state;

  if (issueState !== 'open') {
    return {
      success: true,
      message: 'Issue is not open.'
    };
  }

  const issueUrl = message.issue.html_url;

  const existingReward = await prisma.bounty.findFirst({
    where: {
      githubIssueUrl: issueUrl
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
      space: {
        select: {
          domain: true
        }
      },
      spaceId: true,
      rewardsRepos: true
    }
  });

  if (!spaceGithubConnection) {
    return {
      success: false,
      message: 'Space not found or not connected to CharmVerse GitHub App.'
    };
  }

  if (spaceGithubConnection.rewardsRepos.length === 0) {
    return {
      success: true,
      message: 'Space not connected to any rewards repo.'
    };
  }

  const repositoryId = message.repository.id.toString();

  const rewardsRepo = spaceGithubConnection.rewardsRepos[0];
  if (repositoryId !== rewardsRepo.repositoryId) {
    return {
      success: true,
      message: 'Github repository is not connected to rewards.'
    };
  }

  const label = 'label' in message ? message.label?.name : null;

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
        userId: p.userId,
        roleId: p.roleId
      });
    } else if (p.permissionLevel === 'submitter' && p.roleId) {
      allowedSubmitterRoles.push(p.roleId);
    }
  });

  const issueTitle = message.issue.title;

  const createdReward = await createReward({
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
    rewardType: rewardTemplate ? rewardTemplate.rewardType : undefined,
    allowedSubmitterRoles: allowedSubmitterRoles.length > 0 ? allowedSubmitterRoles : undefined,
    assignedSubmitters: assignedSubmitters.length > 0 ? assignedSubmitters : undefined,
    reviewers:
      reviewers.length > 0
        ? reviewers
        : [
            {
              userId: rewardsRepo.rewardAuthorId
            }
          ],
    githubIssueUrl: issueUrl,
    pageProps: {
      ...rewardTemplate?.page,
      autoGenerated: true,
      type: 'bounty',
      title: issueTitle
    }
  });

  const createdPageId = createdReward.createdPageId!;
  const pages = await getPageMetaList([createdPageId]);

  relay.broadcast(
    {
      type: 'pages_created',
      payload: pages
    },
    spaceId
  );

  if (createIssueComment) {
    try {
      const appOctokit = createOctokitApp(installationId);
      await appOctokit.rest.issues.createComment({
        owner: message.repository.owner.login,
        repo: message.repository.name,
        issue_number: message.issue.number,
        body: `[Link to CharmVerse reward for this Issue](${baseUrl}/${spaceGithubConnection.space.domain}/${createdPageId})`
      });
    } catch (err) {
      log.error('Failed to create issue comment', {
        error: err,
        issueId: message.issue.id,
        repoId: message.repository.id,
        installationId
      });
    }
  }

  trackUserAction('github_issue_reward_create', {
    rewardId: createdReward.reward.id,
    issueId: message.issue.id,
    repoId: message.repository.id,
    action: message.action,
    userId
  });

  return {
    spaceIds: [spaceGithubConnection.spaceId],
    success: true,
    message: 'Reward created.'
  };
}
