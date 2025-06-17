import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type NewsItem = {
  id: string;
  createdAt: Date;
  builder: {
    id: string;
    displayName: string;
    avatar: string | null;
    path: string;
    builderStatus: BuilderStatus | null;
  };
  strikeCount: number;
  githubEvent: {
    title: string;
    url: string;
    repo: {
      owner: string;
      name: string;
    };
  } | null;
};

export async function getNews(): Promise<NewsItem[]> {
  const strikes = await prisma.builderStrike.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      createdAt: true,
      githubEvent: {
        select: {
          title: true,
          url: true,
          repo: {
            select: {
              owner: true,
              name: true
            }
          }
        }
      },
      builder: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
          path: true,
          builderStatus: true
        }
      }
    }
  });

  const builderStrikesCountRecord = strikes.reduce(
    (acc, strike) => {
      acc[strike.builder.id] = (acc[strike.builder.id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return strikes.map((strike) => ({
    id: strike.id,
    createdAt: strike.createdAt,
    builder: strike.builder,
    strikeCount: builderStrikesCountRecord[strike.builder.id],
    githubEvent: strike.githubEvent
  }));
}
