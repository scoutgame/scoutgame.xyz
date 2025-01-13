import type { BuilderNftType, BuilderStatus } from '@charmverse/core/prisma';
import type { BasicUserInfo } from '@packages/users/interfaces';

export type PointMetrics = {
  seasonPoints: number;
  allTimePoints: number;
};

/**
 * @scoutedBy - Unique number of scouts that scouted this user
 * @nftsSold - The total number of tokens issued for this user
 */
export type BuilderMetrics = {
  // scoutedBy: number;
  nftsSold: number;
  price: bigint;
  rank: number;
  level?: number | null;
  estimatedPayout?: number | null;
  last14DaysRank?: number[] | null;
  builderPoints: number;
};

export type BuilderInfo = BasicUserInfo &
  BuilderMetrics & {
    nftType: BuilderNftType;
    builderStatus: BuilderStatus | null;
    farcasterId?: number | null;
    nftImageUrl?: string | null;
    congratsImageUrl: string | null;
    nftsSoldToScout?: number;
  };

export type Last14DaysRank = { date: string; rank: number }[];
