import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { FarcasterDashboard } from 'components/farcaster/FarcasterDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getUserFromSession();
  return <FarcasterDashboard />;
}
