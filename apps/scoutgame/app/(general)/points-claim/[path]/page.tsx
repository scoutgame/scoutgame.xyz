import { getLastWeek } from '@packages/scoutgame/dates';
import { getUserByPath } from '@packages/scoutgame/users/getUserByPath';
import { notFound } from 'next/navigation';

export default async function Claim({ params }: { params: { path: string } }) {
  const user = await getUserByPath(params.path);
  if (!user) {
    return notFound();
  }

  const claimScreenUrl = `https://cdn.charmverse.io/points-claim/${user.id}/${getLastWeek()}.png`;

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={claimScreenUrl} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />

      <meta name='fc:frame:button:1' content='My profile' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta name='fc:frame:button:1:target' content={`${process.env.DOMAIN}/u/${params.path}`} />

      <meta name='fc:frame:button:2' content='Play now' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta name='fc:frame:button:2:target' content={process.env.DOMAIN} />
    </>
  );
}
