import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { CreateProjectPage } from '@packages/scoutgame-ui/components/create-project/CreateProjectPage';

export default async function Page() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  return <CreateProjectPage user={user} />;
}
