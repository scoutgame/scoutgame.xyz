import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { InsecureOperationError } from '@charmverse/core/shared';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { defaultHandler } from 'lib/public-api/handler';
import { stripeClient } from 'lib/subscription/stripe';

export const config = {
  api: {
    bodyParser: false
  }
};

function buffer(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

const handler = defaultHandler();

// handler.use(requireKeys(['contractAddress', 'event', 'networkId'], 'body')).post(stripePayment);
handler.post(stripePayment);

/**
 * @swagger
 * /stripe:
 *   post:
 *     summary: Create/Update a Stripe subscription from an event.
 *     description: We will receive an event and depending on type we will update the db.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *               oneOf:
 *                  - type: object
 *                    properties:
 *                       [key: string]:
 *                          type: string
 *                  - type: string
 *     responses:
 *       200:
 *         description: Update succeeded
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Subcsription'
 */

export async function stripePayment(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!webhookSecret) {
    throw new InsecureOperationError('Stripe webhook secret not found');
  }

  if (!signature) {
    throw new InsecureOperationError('Signature not found');
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed');
  }

  try {
    const body = await buffer(req);
    const event: Stripe.Event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      // Invoice created means that the user has a new invoice to pay
      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscription = await stripeClient.subscriptions.retrieve(invoice.subscription as string, {
          expand: ['plan', 'latest_invoice.payment_intent']
        });

        const space = await prisma.space.findUnique({
          where: { id: stripeSubscription.metadata.spaceId }
        });

        if (!space) {
          log.warn(`Can't update the user subscription. Space not found for subscription ${stripeSubscription.id}`, {
            invoice
          });
          break;
        }

        await prisma.stripeSubscription.create({
          data: {
            customerId: invoice.customer as string,
            subscriptionId: invoice.subscription as string,
            // @ts-ignore There is a plan
            period: (stripeSubscription.plan.interval as string) === 'month' ? 'monthly' : 'annual',
            // @ts-ignore There is a plan
            productId: stripeSubscription.plan.product as string,
            // @ts-ignore There is a plan
            priceId: stripeSubscription.plan.id as string,
            spaceId: stripeSubscription.metadata.spaceId,
            status: 'pending'
          }
        });

        log.info(`The invoice number ${invoice.id} for the subscription ${stripeSubscription.id} was finalised`);

        break;
      }

      // Invoice paid means that the user has paid the invoice using any payment method
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        const stripeSubscription = await stripeClient.subscriptions.retrieve(invoice.subscription as string, {
          expand: ['plan', 'latest_invoice.payment_intent']
        });

        const space = await prisma.space.findUnique({
          where: { id: stripeSubscription.metadata.spaceId }
        });

        if (!space) {
          log.warn(`Can't update the user subscription. Space not found for subscription ${stripeSubscription.id}`, {
            invoice
          });
          break;
        }

        await prisma.$transaction([
          prisma.stripeSubscription.update({
            where: {
              subscriptionId: stripeSubscription.id
            },
            data: {
              status: 'active'
            }
          }),
          prisma.space.update({
            where: {
              id: space.id
            },
            data: {
              paidTier: 'pro'
            }
          })
        ]);

        log.info(`The invoice number ${invoice.id} for the subscription ${stripeSubscription.id} was paid`);

        break;
      }
      default: {
        log.warn(`Unhandled event type in stripe webhook: ${event.type}`);
        break;
      }
    }

    res.status(200).end();
  } catch (err: any) {
    log.warn('Stripe webhook failed to construct event', err);
    res.status(400).json(`Webhook Error: ${err?.message}`);
  }
}

export default handler;
