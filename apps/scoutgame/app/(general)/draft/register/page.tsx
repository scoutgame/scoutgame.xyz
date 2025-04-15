import type { DraftDeveloperSort } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DraftRegisterPage } from 'components/draft/DraftRegisterPage';

export default function Page(params: { searchParams: { search: string; sort: DraftDeveloperSort } }) {
  const search = params.searchParams.search;
  const sort = params.searchParams.sort ?? 'all';
  return <DraftRegisterPage search={search} sort={sort} />;
}
