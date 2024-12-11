import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { notFound } from 'next/navigation';

import { AccountsPage } from 'components/accounts/AccountsPage';
import { PageContainer } from 'components/layout/PageContainer';

export const dynamic = 'force-dynamic';

export default async function Accounts() {
  const user = await getUserFromSession();
  if (!user) {
    return notFound();
  }

  return (
    <PageContainer>
      <AccountsPage user={user} />
    </PageContainer>
  );
}
