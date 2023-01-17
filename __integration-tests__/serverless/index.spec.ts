/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Bounty, Space, User } from '@prisma/client';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import fetch from 'node-fetch';
import { webhookWorker } from 'serverless/handler';
import type { WebhookPayload } from 'serverless/webhook/interfaces';
import { WebhookEventNames } from 'serverless/webhook/interfaces';
import request from 'supertest';

import { prisma } from 'db';
import { createBounty } from 'lib/bounties';
import { addSpaceOperations } from 'lib/permissions/spaces';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: LoggedInUser;
let adminUserSpace: Space;
let adminCookie: string;

jest.mock('node-fetch', () =>
  jest.fn().mockResolvedValueOnce({
    status: 200
  })
);

beforeAll(async () => {
  const first = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = first.user;
  nonAdminUserSpace = first.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const second = await generateUserAndSpaceWithApiToken();

  adminUser = second.user;
  adminUserSpace = second.space;
  adminCookie = await loginUser(adminUser.id);
});

describe('SERVERLESS webhook worker', () => {
  it('should sign payload and execute websocket', async () => {
    const testWebhookPayload: WebhookPayload = {
      createdAt: new Date().toISOString(),
      event: {
        wallet: '',
        scope: WebhookEventNames.ProposalPassed,
        proposal: {
          id: 'id',
          title: 'title',
          url: 'url',
          authors: []
        }
      },
      webhookURL: adminUserSpace.webhookSubscriptionUrl || '',
      signingSecret: adminUserSpace.webhookSigningSecret || '',
      spaceId: adminUserSpace.id
    };

    const testRecord: SQSRecord = {
      body: JSON.stringify(testWebhookPayload),
      messageId: 'messageId',
      receiptHandle: '',
      attributes: {
        ApproximateReceiveCount: '',
        SenderId: '',
        SentTimestamp: '',
        ApproximateFirstReceiveTimestamp: ''
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: '',
      eventSourceARN: '',
      awsRegion: ''
    };

    const event: SQSEvent = {
      Records: [testRecord]
    };

    const res = await webhookWorker(event);

    // Means all the message were successful
    expect(res.batchItemFailures.length).toBe(0);
  });
});
