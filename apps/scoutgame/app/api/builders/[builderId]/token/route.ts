import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getSession } from '@packages/nextjs/session/getSession';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ builderId: string }> }) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { builderId } = await params;
  const { searchParams } = new URL(request.url);
  const nftType = searchParams.get('nftType') as BuilderNftType;

  const scoutId = session.scoutId;

  const builderNft = await prisma.builderNft.findUniqueOrThrow({
    where: {
      builderId_season_nftType: {
        builderId,
        season: getCurrentSeasonStart(),
        nftType
      }
    },
    select: {
      id: true,
      builder: {
        select: {
          wallets: {
            where: {
              primary: true
            },
            select: {
              address: true
            }
          }
        }
      },
      tokenId: true,
      contractAddress: true
    }
  });

  const scoutNft = await prisma.scoutNft.findFirstOrThrow({
    where: {
      builderNftId: builderNft.id,
      scoutWallet: {
        scoutId
      }
    },
    select: {
      scoutWallet: {
        select: {
          address: true
        }
      }
    }
  });

  return Response.json({
    tokenId: builderNft.tokenId,
    contractAddress: builderNft.contractAddress,
    scoutAddress: scoutNft.scoutWallet.address,
    builderNftId: builderNft.id,
    developerWallet: builderNft.builder.wallets[0]?.address
  });
}
