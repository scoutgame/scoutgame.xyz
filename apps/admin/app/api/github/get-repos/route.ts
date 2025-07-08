import { prisma } from '@charmverse/core/prisma-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type GetReposResult = {
  id: number;
  url: string;
  fullName: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partner = searchParams.get('partner') === 'true';
  const nameOrOwner = searchParams.get('nameOrOwner');
  if (!nameOrOwner) {
    return NextResponse.json([]);
  }
  const repos = await prisma.githubRepo.findMany({
    where: {
      scoutPartnerId: partner ? { not: null } : undefined,
      OR: [
        { name: { contains: nameOrOwner, mode: 'insensitive' } },
        { owner: { contains: nameOrOwner, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      owner: true,
      name: true
    },
    take: 100,
    orderBy: {
      _relevance: {
        fields: ['name', 'owner'],
        search: nameOrOwner,
        sort: 'desc'
      }
    }
  });

  const result: GetReposResult[] = repos.map((repo) => {
    return {
      id: repo.id,
      fullName: `${repo.owner}/${repo.name}`,
      url: `https://github.com/${repo.owner}/${repo.name}`
    };
  });
  return NextResponse.json(result);
}
