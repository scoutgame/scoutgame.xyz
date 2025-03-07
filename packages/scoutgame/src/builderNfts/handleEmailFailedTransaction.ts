import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { getUser } from '@packages/nextjs/session/getUser';

import { sendNotifications } from '../notifications/sendNotifications';

export async function handleEmailFailedTransaction({
  userId,
  pendingTransactionId,
  errorMessage = 'Decent transaction failed'
}: {
  userId: string;
  pendingTransactionId: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    const pendingTx = await prisma.pendingNftTransaction.findUnique({
      where: {
        id: pendingTransactionId
      }
    });

    if (!pendingTx) {
      return;
    }

    const user = await getUser(userId);

    if (!user) {
      return;
    }

    await sendNotifications({
      userId,
      notificationType: 'nft_transaction_failed',
      email: {
        templateVariables: {
          name: user?.displayName,
          tx_hash: pendingTx.sourceChainTxHash,
          error_message: errorMessage,
          wallet_address: pendingTx.senderAddress
        }
      },
      farcaster: {
        templateVariables: {
          builderName: user.displayName,
          builderPath: user.path
        }
      }
    });

    log.info('Nft transaction failed email was sent to the user', { userId });
  } catch (error) {
    log.error('Error sending nft transaction failed email', { error, userId });
  }
}
