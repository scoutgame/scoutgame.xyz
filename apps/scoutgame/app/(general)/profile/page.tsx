import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { ProfileTab } from 'components/profile/ProfilePage';
import { ProfilePage } from 'components/profile/ProfilePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'My Profile'
};

export default async function Profile({
  searchParams
}: {
  searchParams: Promise<{
    tab: ProfileTab;
  }>;
}) {
  const user = await getUserFromSession();
  const searchParamsResolved = await searchParams;
  const tab = searchParamsResolved.tab || (user?.builderStatus ? 'build' : 'scout');

  if (!user) {
    return null;
  }

  if ((tab as string) === 'win') {
    redirect('/claim');
  }

  if (!user.onboardedAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  const [, userExternalProfiles] = await safeAwaitSSRData(
    prisma.scout.findUniqueOrThrow({
      where: {
        id: user.id
      },
      select: {
        githubUsers: {
          select: {
            login: true
          }
        },
        talentProfile: {
          select: {
            id: true,
            score: true
          }
        }
      }
    })
  );

  return (
    <PageContainer>
      <ProfilePage
        user={{
          ...user,
          githubLogin: userExternalProfiles?.githubUsers?.[0]?.login,
          talentProfile: userExternalProfiles?.talentProfile ?? undefined
        }}
        tab={tab}
      />
    </PageContainer>
  );
}
