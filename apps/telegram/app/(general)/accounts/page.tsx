import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import { AccountsPage } from '@packages/scoutgame-ui/components/accounts/AccountsPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Accounts() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());

  if (!user) {
    return notFound();
  }

  const [error, currentUserAccountsMetadata] = await safeAwaitSSRData(
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
        nftPurchaseEvents: {
          where: {
            builderNft: {
              season: currentSeason,
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

  if (error) {
    return notFound();
  }

  return (
    <AccountsPage
      user={{
        ...user,
        telegramId: currentUserAccountsMetadata.telegramId,
        wallets: currentUserAccountsMetadata.wallets.map((wallet) => wallet.address),
        avatar: user.avatar as string,
        starterPackNftCount: currentUserAccountsMetadata.nftPurchaseEvents.length
      }}
    />
  );
}
