import { redirect } from 'next/navigation';

import { ScorePage } from 'components/score/ScorePage';
import { getWaitlistSlotWithClicks } from 'lib/scoring/getWaitlistSlotWithClicks';
import { getSession } from 'lib/session/getSession';

export default async function Score() {
  const session = await getSession();

  // Redirect is handled in the middleware
  if (!session.farcasterUser) {
    return null;
  }

  const waitlistSlot = await getWaitlistSlotWithClicks({ fid: parseInt(session.farcasterUser.fid) }).catch(() => null);

  if (!waitlistSlot) {
    redirect('/join');
  }

  return <ScorePage waitlistSlot={waitlistSlot} />;
}
