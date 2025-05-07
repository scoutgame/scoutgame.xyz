import { getLastWeek } from '@packages/dates/utils';
import { getUserByPathCached } from '@packages/users/getUserByPathCached';
import { notFound } from 'next/navigation';

export default async function Claim({
  params,
  searchParams
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const paramsResolved = await params;
  const user = await getUserByPathCached(paramsResolved.path);
  if (!user) {
    return notFound();
  }
  const searchParamsResolved = await searchParams;

  const claimScreenUrl = `https://cdn.charmverse.io/tokens-claim/${user.id}/${searchParamsResolved.week || getLastWeek()}.png`;

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={claimScreenUrl} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />

      <meta name='fc:frame:button:1' content='My profile' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta name='fc:frame:button:1:target' content={`${process.env.DOMAIN}/u/${paramsResolved.path}`} />

      <meta name='fc:frame:button:2' content='Play now' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta name='fc:frame:button:2:target' content={process.env.DOMAIN} />

      <meta name='og:image' content={claimScreenUrl} />
      <meta name='og:image:width' content='600' />
      <meta name='og:image:height' content='600' />
      <meta name='og:url' content={`https://scoutgame.xyz/u/${paramsResolved.path}`} />
      <meta name='og:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='og:description' content={`Points claim screen for ${user.displayName}`} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='twitter:description' content={`Points claim screen for ${user.displayName}`} />
      <meta name='twitter:image' content={claimScreenUrl} />
      <meta name='twitter:url' content={`https://scoutgame.xyz/u/${paramsResolved.path}`} />
    </>
  );
}
