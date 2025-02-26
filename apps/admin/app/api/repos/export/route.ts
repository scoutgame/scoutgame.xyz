import type { NextRequest } from 'next/server';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getRepos } from 'lib/repos/getRepos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partner = searchParams.get('partner') || undefined;
  const rows = await getRepos({ includeInactive: true, partner });
  const exportedRows = rows.map((row) => ({
    ...row,
    url: `https://github.com/${row.owner}/${row.name}`
  }));
  return respondWithTSV(exportedRows, 'github_repos.tsv');
}
