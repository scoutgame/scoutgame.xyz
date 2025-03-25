import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUserScoutProjectsInfo } from '@packages/scoutgame/projects/getUserScoutProjects';
import { PublicProfilePage } from '@packages/scoutgame-ui/components/[path]/PublicProfilePage';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import { getUserByPathCached } from '@packages/users/getUserByPathCached';
import type { Metadata, ResolvingMetadata } from 'next';
import type { ResolvedOpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';
import { notFound } from 'next/navigation';

import { FarcasterMetadata } from 'components/[path]/FarcasterMetadata';

export const dynamic = 'force-dynamic';

type Props = {
  params: { path: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const user = await getUserByPathCached(params.path);

  if (!user) {
    return {};
  }

  const previousMetadata = await parent;
  const previousOg = previousMetadata.openGraph || ({} as ResolvedOpenGraph);

  return {
    title: `${user.displayName} user profile`,
    openGraph: {
      images: user.nftImageUrl || user.avatar || previousOg.images || '',
      title: `${user.displayName} user profile`
    },
    twitter: {
      title: `${user.displayName} user profile`
    }
  };
}

export default async function Profile({ params, searchParams }: Props) {
  const user = await getUserByPathCached(params.path);
  const tab = searchParams.tab || (user?.builderStatus === 'approved' ? 'builder' : 'scout');
  const session = await getSession();
  const loggedInUserId = session?.scoutId;

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  const [, scoutProjects] = await safeAwaitSSRData(getUserScoutProjectsInfo({ userId: user.id }));

  return (
    <>
      <FarcasterMetadata user={user} />
      <PageContainer>
        <PublicProfilePage loggedInUserId={loggedInUserId} user={user} tab={tab} scoutProjects={scoutProjects} />
      </PageContainer>
    </>
  );
}
