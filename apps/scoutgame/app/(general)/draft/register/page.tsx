import type { DraftDeveloperSort } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DraftRegisterPage } from 'components/draft/DraftRegisterPage';

export default async function Page(params: {
  searchParams: Promise<{ search: string; sort: DraftDeveloperSort; tab: string }>;
}) {
  const searchParamsResolved = await params.searchParams;
  const search = searchParamsResolved.search;
  const sort = searchParamsResolved.sort ?? 'all';
  const tab = searchParamsResolved.tab;
  return <DraftRegisterPage search={search} sort={sort} tab={tab} />;
}
