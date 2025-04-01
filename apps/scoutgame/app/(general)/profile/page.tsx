import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUserScoutProjectsInfo } from '@packages/scoutgame/projects/getUserScoutProjects';
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
  searchParams: {
    tab: ProfileTab;
  };
}) {
  const user = await getUserFromSession();
  const tab = searchParams.tab || (user?.builderStatus ? 'build' : 'scout');

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

  const [, scoutProjects] = await safeAwaitSSRData(getUserScoutProjectsInfo({ userId: user.id }));

  return (
    <PageContainer>
      <ProfilePage
        user={{
          ...user,
          githubLogin: userExternalProfiles?.githubUsers?.[0]?.login,
          talentProfile: userExternalProfiles?.talentProfile ?? undefined
        }}
        scoutProjects={scoutProjects}
        tab={tab}
      />
    </PageContainer>
  );
}
