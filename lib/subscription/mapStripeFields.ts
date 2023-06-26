/* eslint-disable camelcase */
import { log } from '@charmverse/core/log';
import type Stripe from 'stripe';

import { coerceToMilliseconds } from 'lib/utilities/dates';

import type { SubscriptionPeriod, SubscriptionStatusType } from './constants';

function mapStripeStatus(subscription: Stripe.Subscription): SubscriptionStatusType {
  const { status, trial_end } = subscription;

  if (subscription.cancel_at_period_end) {
    return 'cancel_at_end';
  } else if (
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

export type PaymentMethod = {
  id: string;
  type: Stripe.PaymentMethod.Type;
  digits?: string;
  brand?: string;
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
  expiresOn?: Date | null;
  renewalDate?: Date | null;
  paymentMethod?: PaymentMethod | null;
  coupon?: string;
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
  const paymentDetails = subscription.default_payment_method as Stripe.PaymentMethod | null;
  const paymentType = paymentDetails?.type;
  const paymentCard = paymentDetails?.card?.brand;
  const last4 = paymentDetails?.card?.last4;
  const paymentMethod = paymentDetails
    ? ({
        id: paymentDetails.id,
        brand: paymentCard,
        digits: last4,
        type: paymentType
      } as PaymentMethod)
    : null;

  const status = mapStripeStatus(subscription);
  const expiryDate =
    status === 'cancel_at_end'
      ? subscription.current_period_end
      : status === 'free_trial'
      ? subscription.trial_end
      : null;

  const fields: SubscriptionFieldsFromStripe = {
    period: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
    priceInCents: subscription.items.data[0].price.unit_amount ?? 0,
    blockQuota,
    status,
    paymentMethod,
    billingEmail: subscription.customer.email,
    expiresOn: typeof expiryDate === 'number' ? new Date(coerceToMilliseconds(expiryDate)) : null,
    renewalDate: subscription.current_period_end
      ? new Date(coerceToMilliseconds(subscription.current_period_end))
      : undefined
  };

  return fields;
}
