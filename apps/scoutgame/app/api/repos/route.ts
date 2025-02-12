import { getRepos } from '@packages/scoutgame/repos/getRepos';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const repos = await getRepos({ limit: 500, searchString: searchString || undefined, filter: 'name' });
  return NextResponse.json(repos);
}
