import { HomePage } from '@connect/components/home/HomePage';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import { redirect } from 'next/navigation';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);

  if (user?.data) {
    redirect('/welcome');
  }

  return <HomePage />;
}
