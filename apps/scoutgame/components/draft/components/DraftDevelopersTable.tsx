import { getDraftDevelopers } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DevelopersTable } from './DevelopersTable';

export async function DraftDevelopersTable() {
  const draftDevelopers = await getDraftDevelopers();

  return <DevelopersTable draftDevelopers={draftDevelopers} />;
}
