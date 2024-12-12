import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import { notFound } from 'next/navigation';

import { AccountsPage } from 'components/accounts/AccountsPage';

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
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          nftsPurchased: true
        }
      },
      builderStatus: true
    }
  });

  return (
    <PageContainer>
      <AccountsPage
        user={{
          ...user,
          nftsPurchased: currentUserAccountsMetadata.userSeasonStats[0]?.nftsPurchased ?? 0,
          telegramId: currentUserAccountsMetadata.telegramId,
          wallets: currentUserAccountsMetadata.wallets.map((wallet) => wallet.address),
          builderStatus: currentUserAccountsMetadata.builderStatus,
          avatar: user.avatar as string
        }}
      />
    </PageContainer>
  );
}
