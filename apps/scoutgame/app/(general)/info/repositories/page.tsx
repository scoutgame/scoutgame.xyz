import { getPopularRepos } from '@packages/scoutgame/repos/getRepos';
import { RepositoriesPage } from '@packages/scoutgame-ui/components/info/pages/RepositoriesPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repositories'
};

export const dynamic = 'force-dynamic';

export default async function Repositories() {
  const popularRepos = await getPopularRepos();
  return <RepositoriesPage popularRepos={popularRepos} />;
}
