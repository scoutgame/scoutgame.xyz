import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { AccountsPage } from '@packages/scoutgame-ui/components/accounts/AccountsPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Accounts() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());

  if (!user) {
    return notFound();
  }

  const [, currentUserAccountsMetadata] = await safeAwaitSSRData(
    prisma.scout.findFirstOrThrow({
      where: {
        id: user.id
      },
      select: {
        telegramId: true,
        telegramName: true,
        email: true,
        sendTransactionEmails: true,
        sendFarcasterNotification: true,
        emailVerifications: true,
        wallets: {
          select: {
            address: true,
            primary: true
          }
        }
      }
    })
  );

  if (!currentUserAccountsMetadata) {
    return notFound();
  }

  const verifiedEmail = currentUserAccountsMetadata.emailVerifications.some(
    (verification) => verification.email === currentUserAccountsMetadata.email && verification.completedAt
  );

  return (
    <AccountsPage
      user={{
        ...user,
        email: currentUserAccountsMetadata.email as string,
        sendFarcasterNotification: currentUserAccountsMetadata.sendFarcasterNotification,
        sendTransactionEmails: currentUserAccountsMetadata.sendTransactionEmails,
        telegramId: currentUserAccountsMetadata.telegramId,
        telegramName: currentUserAccountsMetadata.telegramName || null,
        wallets: currentUserAccountsMetadata.wallets.map((wallet) => ({
          address: wallet.address,
          primary: wallet.primary
        })),
        avatar: user.avatar as string,
        verifiedEmail
      }}
    />
  );
}
