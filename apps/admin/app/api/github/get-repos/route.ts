import type { Prisma } from '@charmverse/core/prisma-client';
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
  const [ownerOrName, name] = nameOrOwner?.replaceAll('https://github.com/', '').split('/') || [];
  if (!nameOrOwner) {
    return NextResponse.json([]);
  }

  const where: Prisma.GithubRepoWhereInput = {
    scoutPartnerId: partner ? { not: null } : undefined
  };

  if (ownerOrName && name) {
    where.AND = [{ name }, { owner: ownerOrName }];
  } else if (ownerOrName) {
    where.OR = [{ owner: ownerOrName }, { name: ownerOrName }];
  }

  const repos = await prisma.githubRepo.findMany({
    where,
    select: {
      id: true,
      owner: true,
      name: true
    },
    take: 100
  });

  const result: GetReposResult[] = repos
    .map((repo) => {
      return {
        id: repo.id,
        fullName: `${repo.owner}/${repo.name}`,
        url: `https://github.com/${repo.owner}/${repo.name}`
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return NextResponse.json(result);
}
