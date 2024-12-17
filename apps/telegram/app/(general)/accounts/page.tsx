import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { AccountsPage } from '@packages/scoutgame-ui/components/accounts/AccountsPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Accounts() {
  const user = await getUserFromSession();
  if (!user) {
    return notFound();
  }

  const currentUserAccountsMetadata = await prisma.scout.findFirstOrThrow({
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
  });

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
