import type { Space } from '@charmverse/core/prisma-client';
import Stripe from 'stripe';
import request from 'supertest';
import { v4 } from 'uuid';

import { stripeClient } from 'lib/subscription/stripe';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

jest.mock('lib/subscription/stripe', () => ({
  stripeClient: {
    webhooks: {
      constructEvent: jest.fn()
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn()
    },
    paymentIntents: {
      retrieve: jest.fn()
    }
  }
}));

const _stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  host: 'localhost',
  protocol: 'http',
  port: 12111,
  apiVersion: '2022-11-15'
});

const invoiceId = v4();
const subscriptionId = v4();
const paymentIntentId = v4();
const priceId = v4();
const productId = v4();

const payload = {
  id: 'evt_1NIulWCoqmaE6diLjyGS6Aqd',
  object: 'event',
  type: 'invoice.paid',
  api_version: '2020-08-27',
  created: 1685025603,
  data: {
    object: {
      id: invoiceId,
      plan: {
        id: priceId,
        interval: 'month',
        product: productId
      },
      paid: true,
      payment_intent: paymentIntentId,
      billing_reason: 'subscription_create',
      object: 'invoice',
      status: 'paid',
      subscription: subscriptionId,
      subtotal: 1000,
      total: 1000
    }
  }
};

const payloadString = JSON.stringify(payload, null, 2);
const payloadBuffer = Buffer.from(payloadString);
const payloadLength = String(payloadBuffer.length);

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
});

describe('POST api/v1/webhooks/stripe - Catch events from Stripe', () => {
  it('should update the subscription status', async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const header = _stripeClient.webhooks.generateTestHeaderString({
      payload: payloadBuffer.toString(),
      secret
    });

    const retrieveSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: subscriptionId,
      metaData: {
        spaceId: space.id,
        tier: 'pro'
      }
    });

    const retrievePaymentIntentsMockFn = jest.fn().mockResolvedValue({
      id: paymentIntentId,
      payment_method: 'card'
    });

    const updateSubscriptionsMockFn = jest.fn().mockResolvedValue({ id: subscriptionId });

    const event = _stripeClient.webhooks.constructEvent(payloadBuffer, header, secret);

    const constructEventMockFn = jest.fn().mockResolvedValue(event);

    (stripeClient.webhooks.constructEvent as jest.Mock<any, any>) = constructEventMockFn;
    (stripeClient.paymentIntents.retrieve as jest.Mock<any, any>) = retrievePaymentIntentsMockFn;
    (stripeClient.subscriptions.retrieve as jest.Mock<any, any>) = retrieveSubscriptionsMockFn;
    (stripeClient.subscriptions.update as jest.Mock<any, any>) = updateSubscriptionsMockFn;

    const response = await request(baseUrl)
      .post('/api/v1/webhooks/stripe')
      .send(payloadBuffer)
      .set('Stripe-Signature', header)
      .set('Content-Length', payloadLength)
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('user-agent', 'Stripe/1.0 (+https://stripe.com/docs/webhooks)')
      .set('host', '127.0.0.1:3335')
      .expect(200);

    // Do something with mocked signed event
    expect(event.id).toEqual(payload.id);
  });
});
