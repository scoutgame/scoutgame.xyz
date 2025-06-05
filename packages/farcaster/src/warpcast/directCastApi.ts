import { PUT } from '@packages/utils/http';
import { v4 as uuid } from 'uuid';

// This API requires the user to be whitelisted privileges to use this method
// Docs: https://warpcast.notion.site/Direct-Cast-API-Reference-Public-1276a6c0c1018089af2bda0d1697a2fd

// Sends a message to a group chat, conversation or recipient depending on which id is provided.
// limit: Max 5,000 messages per caller per day.
export async function sendDirectCast({
  recipientFid,
  message,
  apiToken
}: {
  recipientFid: number;
  message: string;
  apiToken: string;
}) {
  if (message.length > 1024) {
    throw new Error('Message length must be less than 1024 characters');
  }
  return PUT<{ result: { messageId: string; conversationId?: string } }>(
    'https://api.farcaster.xyz/fc/message',
    {
      recipientFid: recipientFid?.toString(),
      message,
      apiToken
    },
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        // allows idempotent retries
        'idempotency-key': uuid()
      }
    }
  );
}
