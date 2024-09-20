import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfilePage } from 'components/profile/ProfilePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'My Profile'
};

export default async function Profile() {
  const user = await getUserFromSession();

  if (!user) {
    redirect('/');
  }

  if (!user.onboardedAt) {
    redirect('/welcome');
  }

  return <ProfilePage user={user} />;
}
