import type { DraftDeveloperSort } from '@packages/scoutgame/drafts/getDraftDevelopers';
import { getDraftDevelopers } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DevelopersTable } from './DevelopersTable';

export async function DraftDevelopersTable({ search, sort }: { search?: string; sort?: DraftDeveloperSort }) {
  const draftDevelopers = await getDraftDevelopers({ search, sort });

  return <DevelopersTable draftDevelopers={draftDevelopers} />;
}
