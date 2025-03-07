import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { CreateProjectPage } from '@packages/scoutgame-ui/components/projects/create/CreateProjectPage';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  // if (user.builderStatus !== 'approved' && user.utmCampaign !== 'taiko') {
  //   return redirect('/developers');
  // }

  return <CreateProjectPage user={user} />;
}
