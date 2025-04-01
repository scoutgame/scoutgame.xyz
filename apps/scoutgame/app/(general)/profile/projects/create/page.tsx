import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { redirect } from 'next/navigation';

import { CreateProjectPage } from 'components/projects/create/CreateProjectPage';

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
