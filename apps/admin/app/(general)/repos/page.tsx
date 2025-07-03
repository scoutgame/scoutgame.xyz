import { getScoutPartnersInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';

import { ReposDashboard } from 'components/repos/ReposDashboard';
import { getRepos } from 'lib/repos/getRepos';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [repos, scoutPartners] = await Promise.all([getRepos({ limit: 500 }), getScoutPartnersInfo()]);
  return <ReposDashboard repos={repos} scoutPartners={scoutPartners} />;
}
