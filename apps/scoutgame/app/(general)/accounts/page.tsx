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
        wallets: {
          select: {
            address: true
          }
        },
        email: true,
        sendTransactionEmails: true,
        sendMarketing: true,
        nftPurchaseEvents: {
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
    })
  );

  if (!currentUserAccountsMetadata) {
    return notFound();
  }

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
        starterPackNftCount: currentUserAccountsMetadata.nftPurchaseEvents.length
      }}
    />
  );
}
