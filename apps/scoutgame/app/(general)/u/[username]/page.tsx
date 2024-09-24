import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicProfileDetailsPage } from 'components/profile/[username]/PublicProfileDetailsPage';
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
  const tab = searchParams.tab || 'scout';

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return <PublicProfileDetailsPage user={{ ...user }} tab={tab} />;
}
