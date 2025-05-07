import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getSession } from '@packages/nextjs/session/getSession';
import { NextResponse } from 'next/server';

export type NftCountResponse = {
  nftCount: number;
};

export async function GET(request: Request) {
  const session = await getSession();
  const scoutId = session?.scoutId;

  if (!scoutId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const nfts = await prisma.scoutNft.findMany({
    where: {
      scoutWallet: {
        scoutId
      },
      builderNft: {
        season: getCurrentSeasonStart()
      }
    },
    select: {
      id: true
    }
  });
  const nftCount = nfts.length;

  return NextResponse.json({ nftCount } as NftCountResponse);
}
