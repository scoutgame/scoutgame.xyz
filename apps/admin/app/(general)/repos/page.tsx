import { ReposDashboard } from 'components/repos/ReposDashboard';
import { getRepos } from 'lib/repos/getRepos';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const repos = await getRepos({ limit: 500 });
  return <ReposDashboard repos={repos} />;
}
