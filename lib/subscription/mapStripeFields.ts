/* eslint-disable camelcase */
import { log } from '@charmverse/core/log';
import type Stripe from 'stripe';

import type { SubscriptionPeriod, SubscriptionStatusType } from './constants';

function mapStripeStatus(subscription: Stripe.Subscription): SubscriptionStatusType {
  const { status, trial_end } = subscription;
  if (
    trial_end &&
    // Stripe value is in seconds
    (trial_end && 1000) > Date.now()
  ) {
    return 'free_trial';
  }

  switch (status) {
    case 'active':
      return 'active';
    case 'incomplete_expired':
    case 'canceled':
      return 'cancelled';
    case 'past_due':
      return 'past_due';
    case 'trialing':
      return 'free_trial';
    case 'unpaid':
    case 'incomplete':
    default:
      log.error(`Invalid subscription status ${subscription.status}`);
      return 'pending';
  }
}
export type PaymentMethodType = 'card' | 'ach';

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  digits: string;
};

/**
 * @blockQuota - The number of blocks a space can have in total, expressed as a multiple of 1k.
 * @cancelAtPeriodEnd - Whether the subscription has been cancelled and will terminate at the end of the current period.
 * @expiresOn - The date when the free trial will expire OR the cancellation will be final.
 * @renewalDate - The date when the next payment will occur
 * @priceInCents - The price of the subscription in cents - Stripe models the amount like this
 */
export type SubscriptionFieldsFromStripe = {
  period: SubscriptionPeriod;
  status: SubscriptionStatusType;
  blockQuota: number;
  priceInCents: number;
  billingEmail?: string | null;
  expiresOn?: Date;
  renewalDate?: Date;
  paymentMethod?: PaymentMethod | null;
};
export function mapStripeFields({
  subscription,
  spaceId
}: {
  subscription: Stripe.Subscription & { customer: Stripe.Customer };
  spaceId: string;
}): SubscriptionFieldsFromStripe {
  // We expect to always have a quantity, but we'll log an error if we don't
  const blockQuota = subscription.items.data[0].quantity as number;

  if (!blockQuota) {
    log.error(`No block quota found for subscription ${subscription.id}`, {
      spaceId,
      subscriptionId: subscription.id,
      customerId: subscription.customer.id
    });
  }

  const fields: SubscriptionFieldsFromStripe = {
    period: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
    priceInCents: subscription.items.data[0].price.unit_amount ?? 0,
    blockQuota,
    status: mapStripeStatus(subscription),
    paymentMethod: null,
    billingEmail: subscription.customer.email,
    expiresOn: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    renewalDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
  };

  return fields;
}
