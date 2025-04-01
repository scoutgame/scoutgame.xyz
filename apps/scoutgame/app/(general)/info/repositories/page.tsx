import { getPopularRepos } from '@packages/scoutgame/repos/getRepos';
import type { Metadata } from 'next';

import { RepositoriesPage } from 'components/info/pages/RepositoriesPage';

export const metadata: Metadata = {
  title: 'Repositories'
};

export const dynamic = 'force-dynamic';

export default async function Repositories() {
  const popularRepos = await getPopularRepos();
  return <RepositoriesPage popularRepos={popularRepos} />;
}
