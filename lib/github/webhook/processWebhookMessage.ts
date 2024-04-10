import { createHmac } from 'crypto';

import type { IssuesLabeledEvent, IssuesOpenedEvent } from '@octokit/webhooks-types';

import type { WebhookMessageProcessResult } from 'lib/collabland/webhook/interfaces';

import { createRewardFromIssue } from '../createRewardFromIssue';

type GithubWebhookPayload = {
  body: {
    [key: string]: any;
    action: string;
  };
  headers: {
    [key: string]: any;
    'X-Hub-Signature-256': string;
  };
};

type MessageHandlers = {
  labeled: (message: IssuesLabeledEvent) => Promise<WebhookMessageProcessResult>;
  opened: (message: IssuesOpenedEvent) => Promise<WebhookMessageProcessResult>;
};

const messageHandlers: MessageHandlers = {
  labeled: async (message: IssuesLabeledEvent) => {
    const installationId = message.installation?.id;
    if (!installationId) {
      return {
        success: true,
        message: 'Missing installation ID.'
      };
    }

    if (!message.issue || !message.repository) {
      return {
        success: true,
        message: 'Missing issue or repository data.'
      };
    }

    return createRewardFromIssue({
      installationId: installationId.toString(),
      issueTitle: message.issue.title,
      repositoryId: message.repository.id.toString(),
      label: message.label?.name,
      issueState: message.issue.state
    });
  },

  opened: async (message: IssuesOpenedEvent) => {
    const installationId = message.installation?.id;
    if (!installationId) {
      return {
        success: true,
        message: 'Missing installation ID.'
      };
    }

    if (!message.issue || !message.repository) {
      return {
        success: true,
        message: 'Missing issue or repository data.'
      };
    }

    return createRewardFromIssue({
      installationId: installationId.toString(),
      issueTitle: message.issue.title,
      repositoryId: message.repository.id.toString(),
      issueState: message.issue.state
    });
  }
};

export async function processWebhookMessage(message: GithubWebhookPayload): Promise<WebhookMessageProcessResult> {
  const data = message?.body;
  const action = data?.action as 'labeled';

  if (!messageHandlers[action]) {
    // we cannot process this message, just remove from queue
    return {
      success: true,
      message: `Unsupported action payload: ${action || 'undefined'}`
    };
  }

  const handler = messageHandlers[action];
  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    return {
      success: true,
      message: 'Webhook message without permission to be parsed.'
    };
  }

  return handler(message.body as IssuesLabeledEvent);
}

export async function verifyWebhookMessagePermission(message: GithubWebhookPayload) {
  const xHubSignature256 = message.headers['X-Hub-Signature-256'];
  if (!xHubSignature256) {
    return false;
  }
  const hmac = createHmac('sha256', process.env.GITHUB_APP_WEBHOOK_SECRET!);
  const digest = `sha256=${hmac.update(JSON.stringify(message.body)).digest('hex')}`;

  return xHubSignature256 === digest;
}
