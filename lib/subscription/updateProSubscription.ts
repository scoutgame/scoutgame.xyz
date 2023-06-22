import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { UpdateSubscriptionRequest } from './interfaces';
import { stripeClient } from './stripe';

export async function updateProSubscription({
  spaceId,
  payload
}: {
  spaceId: string;
  payload: UpdateSubscriptionRequest;
}) {
  const { email, status } = payload;
  const spaceSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      spaceId,
      deletedAt: null
    }
  });

  if (!spaceSubscription) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  const subscription = await stripeClient.subscriptions.retrieve(spaceSubscription.subscriptionId);

  if (subscription.status !== 'active') {
    throw new InvalidStateError(`Subscription ${subscription.id} is not active`);
  }

  if (status) {
    await stripeClient.subscriptions.update(spaceSubscription.subscriptionId, {
      cancel_at_period_end: status === 'cancel_at_end'
    });

    await prisma.stripeSubscription.update({
      where: {
        id: spaceSubscription.id,
        spaceId
      },
      data: {
        status
      }
    });
  }

  if (email) {
    await stripeClient.customers.update(spaceSubscription.customerId, {
      email: payload.email
    });
  }
}
