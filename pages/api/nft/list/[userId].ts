import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { NftData } from 'lib/blockchain/interfaces';
import { getNFTs } from 'lib/blockchain/nfts';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getNFTsMiddleware);

const supportedMainnets = [1, 137, 42161] as const;

async function getNFTsMiddleware(req: NextApiRequest, res: NextApiResponse<NftData[] | { error: string }>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;

  const profileItems = await prisma.profileItem.findMany({
    where: {
      userId,
      type: 'nft',
      OR: [{ isHidden: true }, { isPinned: true }]
    },
    select: {
      id: true,
      isHidden: true,
      isPinned: true
    }
  });

  const hiddenNftIds = profileItems.filter((p) => p.isHidden).map((p) => p.id);
  const pinnedNftIds = profileItems.filter((p) => p.isPinned).map((p) => p.id);

  const wallets = await prisma.userWallet.findMany({
    where: {
      userId
    }
  });

  const mappedNfts = (
    await Promise.all(
      supportedMainnets.map((mainnetChainId) =>
        getNFTs(
          wallets.map((w) => w.address),
          mainnetChainId
        )
      )
    )
  ).flat();

  res.status(200).json(
    mappedNfts.map((nft) => ({
      ...nft,
      isHidden: hiddenNftIds.includes(nft.id),
      isPinned: pinnedNftIds.includes(nft.id)
    }))
  );
}

export default withSessionRoute(handler);
