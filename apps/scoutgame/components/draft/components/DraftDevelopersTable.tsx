import { getDraftDevelopers } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DevelopersTable } from './DevelopersTable';

export async function DraftDevelopersTable({ search }: { search?: string }) {
  const draftDevelopers = await getDraftDevelopers({ search });

  return <DevelopersTable draftDevelopers={draftDevelopers} />;
}
