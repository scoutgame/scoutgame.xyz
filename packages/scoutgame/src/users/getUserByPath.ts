import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../dates/utils';
import { BasicUserInfoSelect } from '../users/queries';

import type { BasicUserInfo } from './interfaces';

export type TalentProfile = {
  id: number;
  score: number;
};

export async function getUserByPath(path: string): Promise<
  | (BasicUserInfo & {
      nftImageUrl?: string;
      congratsImageUrl?: string | null;
      builderStatus: BuilderStatus | null;
      displayName: string;
      talentProfile: TalentProfile | null;
      hasMoxieProfile: boolean;
    })
  | null
> {
  const user = await prisma.scout.findFirst({
    where: {
      path,
      deletedAt: null
    },
    select: {
      ...BasicUserInfoSelect,
      displayName: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart(),
          nftType: BuilderNftType.default
        }
      },
      farcasterName: true,
      hasMoxieProfile: true,
      talentProfile: {
        select: {
          id: true,
          score: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    nftImageUrl: user?.builderNfts[0]?.imageUrl,
    congratsImageUrl: user?.builderNfts[0]?.congratsImageUrl,
    githubLogin: user?.githubUsers[0]?.login,
    talentProfile: user.talentProfile,
    hasMoxieProfile: user.hasMoxieProfile
  };
}
