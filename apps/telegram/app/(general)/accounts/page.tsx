import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
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
        email: true,
        sendTransactionEmails: true,
        sendMarketing: true,
        emailVerifications: true,
        wallets: {
          select: {
            address: true,
            scoutedNfts: {
              where: {
                builderNft: {
                  season: getCurrentSeasonStart(),
                  nftType: 'starter_pack'
                }
              },
              select: {
                id: true
              }
            }
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
        sendTransactionEmails: currentUserAccountsMetadata.sendTransactionEmails,
        sendMarketing: currentUserAccountsMetadata.sendMarketing,
        telegramId: currentUserAccountsMetadata.telegramId,
        wallets: currentUserAccountsMetadata.wallets.map((wallet) => wallet.address),
        avatar: user.avatar as string,
        starterPackNftCount: currentUserAccountsMetadata.wallets
          .flatMap((wallet) => wallet.scoutedNfts.length)
          .reduce((acc, curr) => acc + curr, 0),
        verifiedEmail
      }}
    />
  );
}
