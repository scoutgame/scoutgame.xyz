import type { BuilderStatus, Prisma, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { validate } from 'uuid';

export type ScoutGameUser = Pick<
  Scout,
  | 'builderStatus'
  | 'path'
  | 'id'
  | 'avatar'
  | 'displayName'
  | 'createdAt'
  | 'reappliedAt'
  | 'farcasterName'
  | 'currentBalance'
  | 'email'
  | 'farcasterId'
> & { githubLogin: string | null; nftsPurchased: number; wallets: string[]; strikeCount: number };

export type SortField =
  | 'displayName'
  | 'builderStatus'
  | 'currentBalance'
  | 'nftsPurchased'
  | 'createdAt'
  | 'strikeCount';
export type SortOrder = 'asc' | 'desc';

export async function getUsers({
  searchString,
  sortField,
  sortOrder,
  builderStatus
}: {
  searchString?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  builderStatus?: BuilderStatus;
} = {}): Promise<ScoutGameUser[]> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }
  // assume farcaster id if search string is a number
  const userFid = getNumberFromString(searchString);
  const isScoutId = validate(searchString || '');

  const userWhereClause: Prisma.ScoutWhereInput = {};

  if (userFid) {
    userWhereClause.farcasterId = userFid;
  } else if (isScoutId) {
    userWhereClause.id = searchString;
  } else if (typeof searchString === 'string') {
    userWhereClause.OR = [
      { path: { search: `*${searchString}:*`, mode: 'insensitive' } },
      { displayName: { search: `*${searchString}:*`, mode: 'insensitive' } },
      { farcasterName: { search: `*${searchString}:*`, mode: 'insensitive' } },
      { githubUsers: { some: { login: { search: `*${searchString}:*`, mode: 'insensitive' } } } },
      { email: { startsWith: searchString, mode: 'insensitive' } },
      { wallets: { some: { address: { search: `*${searchString}:*`, mode: 'insensitive' } } } }
    ];
  } else if (builderStatus) {
    userWhereClause.builderStatus = builderStatus;
  }

  if (sortField === 'strikeCount') {
    userWhereClause.builderStatus = {
      in: ['approved', 'rejected']
    };
  }

  const users = await prisma.scout.findMany({
    take: sortField === 'nftsPurchased' ? 1000 : sortField === 'strikeCount' ? undefined : 500,
    orderBy:
      !userFid && typeof searchString === 'string'
        ? {
            _relevance: {
              fields: ['path', 'displayName', 'farcasterName', 'email', 'id'],
              search: `*${searchString}:*`,
              sort: 'desc'
            }
          }
        : sortField === 'nftsPurchased'
          ? {
              /*  TODO - sort by nfts purchased */
              createdAt: sortOrder || 'desc'
            }
          : sortField && sortField !== 'strikeCount'
            ? { [sortField]: sortOrder || 'asc' }
            : { createdAt: sortOrder || 'desc' },
    where: userWhereClause,
    include: {
      githubUsers: true,
      strikes: {
        where: {
          deletedAt: null
        },
        select: {
          id: true
        }
      },
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        }
      },
      wallets: true
    }
  });

  let processedUsers = users.map(({ githubUsers, userSeasonStats, wallets, strikes, ...user }) => ({
    ...user,
    githubLogin: githubUsers[0]?.login || null,
    nftsPurchased: userSeasonStats[0]?.nftsPurchased || 0,
    wallets: wallets.map((wallet) => wallet.address),
    strikeCount: strikes.length
  }));

  // Handle strike count sorting in memory since we already have filtered strikes
  if (sortField === 'strikeCount') {
    processedUsers = processedUsers.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.strikeCount - b.strikeCount;
      }
      return b.strikeCount - a.strikeCount;
    });
  }

  return processedUsers.slice(0, 500);
}

export function getNumberFromString(searchString?: string) {
  const userFidRaw = parseInt(searchString ?? '', 10);
  const isEqualToItself = searchString === userFidRaw.toString(); // uuids like "055f1650-517b-484e-a1c0-c050ef5aae4a" can sometimes return a number, which we don't want
  return Number.isNaN(userFidRaw) || !isEqualToItself ? undefined : userFidRaw;
}
