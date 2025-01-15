import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';

import { FarcasterDashboard } from 'components/farcaster/FarcasterDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getUserFromSession();
  const isChris = user?.farcasterId === 472;
  return <FarcasterDashboard defaultAccount={isChris ? 'chris' : 'scout'} />;
}
