'use server';

import { log } from '@charmverse/core/log';
import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import { sendDirectCast } from '@packages/farcaster/warpcast/directCastApi';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

export type SuccessResponse = {
  type: 'success';
  sent: number;
};

export type InvalidInputResponse = {
  type: 'invalid_input';
  invalidRecipients: string[];
};

export type APIErrorResponse = {
  type: 'warpcast_error';
  sentRecipients: string[];
  unsentRecipients: string[];
  error: string;
};

type SendMessagesResponse = SuccessResponse | InvalidInputResponse | APIErrorResponse;

// Keep tokens secure on server
const FARCASTER_ACCOUNTS = {
  chris: {
    apiToken: process.env.WARPCAST_API_KEY_CHRIS
  },
  scout: {
    apiToken: process.env.WARPCAST_API_KEY_SCOUT
  }
} as const;

export type AccountId = keyof typeof FARCASTER_ACCOUNTS;

export const sendMessagesAction = authActionClient
  .metadata({ actionName: 'delete_repo' })
  .schema(
    yup.object({
      recipients: yup.array().of(yup.string().required()).required(),
      message: yup.string().required(),
      accountId: yup
        .string()
        .oneOf(Object.keys(FARCASTER_ACCOUNTS) as AccountId[])
        .required()
    })
  )
  .action(async ({ ctx, parsedInput }): Promise<SendMessagesResponse> => {
    const { recipients, message, accountId } = parsedInput;

    const account = FARCASTER_ACCOUNTS[accountId as AccountId];
    if (!account?.apiToken) {
      throw new Error('Invalid account selected');
    }

    const invalidRecipients: string[] = [];
    const recipientFids: [string, number][] = [];

    for (const recipient of recipients) {
      try {
        const recipientFid = await getFarcasterFid(recipient);
        if (!recipientFid) {
          log.warn(`Could not find Farcaster ID for ${recipient}`);
          invalidRecipients.push(recipient);
        } else {
          recipientFids.push([recipient, recipientFid]);
        }
      } catch (error) {
        log.error(`Error getting Farcaster ID for ${recipient}`, { error });
        invalidRecipients.push(recipient);
      }
    }
    if (invalidRecipients.length > 0) {
      return { type: 'invalid_input', invalidRecipients } as InvalidInputResponse;
    }
    const sentRecipients: string[] = [];
    const unsentRecipients: string[] = [];
    let sendingError: string | undefined;
    for (const [recipient, recipientFid] of recipientFids) {
      try {
        const result = await sendDirectCast({
          recipientFid,
          message,
          apiToken: account.apiToken
        });
        log.info(`Sent message to ${recipient}`, { recipientFid, result });
        sentRecipients.push(recipient);
      } catch (error) {
        log.error(`Error sending message to ${recipientFid}`, {
          recipient,
          recipientFid,
          error,
          errors: (error as any).errors
        });
        unsentRecipients.push(recipient);
        sendingError = (error as Error).message || (error as any).errors?.[0]?.message || error;
      }
    }
    if (unsentRecipients.length > 0) {
      return {
        type: 'warpcast_error',
        sentRecipients,
        unsentRecipients,
        error: sendingError
      } as APIErrorResponse;
    }
    return { sent: sentRecipients.length, type: 'success' } as SuccessResponse;
  });

async function getFarcasterFid(recipient: string) {
  // if recipient is a number, return it
  if (!Number.isNaN(Number(recipient))) {
    return Number(recipient);
  }
  const user = await getFarcasterUserByUsername(recipient);
  return user?.fid;
}
