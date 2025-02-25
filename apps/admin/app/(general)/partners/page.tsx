import { PartnersDashboard } from 'components/partners/PartnersDashboard';
import { getRepos } from 'lib/repos/getRepos';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  return <PartnersDashboard />;
}
