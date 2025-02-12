import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { CreateProjectPage } from '@packages/scoutgame-ui/components/create-project/CreateProjectPage';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  if (user.builderStatus !== 'approved') {
    return redirect('/developers');
  }

  return <CreateProjectPage user={user} />;
}
