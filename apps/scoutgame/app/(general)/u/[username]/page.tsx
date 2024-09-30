import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicProfilePage } from 'components/[username]/PublicProfilePage';
import { getUserByPath } from 'lib/users/getUserByPath';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Profile'
};

export default async function Profile({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getUserByPath(params.username);
  const tab = searchParams.tab || (user?.builderStatus === 'approved' ? 'build' : 'scout');

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return <PublicProfilePage user={user} tab={tab} />;
}