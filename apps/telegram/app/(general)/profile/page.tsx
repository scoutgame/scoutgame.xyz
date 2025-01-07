import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { ProfileTab } from '@packages/scoutgame-ui/components/profile/ProfilePage';
import { ProfilePage } from '@packages/scoutgame-ui/components/profile/ProfilePage';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile'
};

export default async function Profile({
  searchParams
}: {
  searchParams: {
    tab: ProfileTab;
  };
}) {
  const user = await getUserFromSession({ sameSite: 'none' });
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
        hasMoxieProfile: true,
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
    <ProfilePage
      user={{
        ...user,
        githubLogin: userExternalProfiles?.githubUsers?.[0]?.login,
        hasMoxieProfile: userExternalProfiles?.hasMoxieProfile ?? false,
        talentProfile: userExternalProfiles?.talentProfile ?? undefined
      }}
      tab={tab}
    />
  );
}
