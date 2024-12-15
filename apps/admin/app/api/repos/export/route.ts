import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getRepos } from 'lib/repos/getRepos';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await getRepos({ includeInactive: true });
  const exportedRows = rows.map((row) => ({
    ...row,
    url: `https://github.com/${row.owner}/${row.name}`
  }));
  return respondWithTSV(exportedRows, 'github_repos.tsv');
}
