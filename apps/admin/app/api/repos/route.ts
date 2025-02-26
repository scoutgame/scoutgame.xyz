import { importReposByUser } from '@packages/scoutgame/importReposByUser';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getRepos } from 'lib/repos/getRepos';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const repos = await getRepos({ limit: 500, searchString: searchString || undefined });
  return NextResponse.json(repos);
}

export async function POST(request: NextRequest) {
  const { owner, partner } = await request.json();

  await importReposByUser(owner, partner);

  return NextResponse.json({ success: true });
}
