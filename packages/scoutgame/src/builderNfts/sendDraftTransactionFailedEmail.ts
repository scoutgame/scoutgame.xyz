import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUser } from '@packages/nextjs/session/getUser';

import { sendNotifications } from '../notifications/sendNotifications';

export async function sendDraftTransactionFailedEmail({
  userId,
  draftOfferId,
  errorMessage = 'Draft transaction failed'
}: {
  userId: string;
  draftOfferId: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    const draftOffer = await prisma.draftSeasonOffer.findUnique({
      where: {
        id: draftOfferId
      }
    });

    if (!draftOffer) {
      return;
    }

    const user = await getUser(userId);

    if (!user) {
      return;
    }

    await sendNotifications({
      userId,
      notificationType: 'draft_transaction_failed',
      email: {
        templateVariables: {
          name: user?.displayName,
          tx_hash: draftOffer.decentTxHash ?? '',
          error_message: errorMessage,
          wallet_address: draftOffer.makerWalletAddress
        }
      },
      farcaster: {
        templateVariables: undefined
      },
      app: {
        templateVariables: undefined
      }
    });

    log.info('Draft transaction failed email was sent to the user', { userId });
  } catch (error) {
    log.error('Error sending draft transaction failed email', { error, userId });
  }
}
