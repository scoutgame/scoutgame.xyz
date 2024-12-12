import { prisma } from '@charmverse/core/prisma-client';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { AccountsPage } from '@packages/scoutgame-ui/components/accounts/AccountsPage';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
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
      }
    }
  });

  return (
    <PageContainer>
      <AccountsPage
        user={{
          ...user,
          telegramId: currentUserAccountsMetadata.telegramId,
          wallets: currentUserAccountsMetadata.wallets.map((wallet) => wallet.address),
          avatar: user.avatar as string
        }}
      />
    </PageContainer>
  );
}
