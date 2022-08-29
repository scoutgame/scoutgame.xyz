import { prisma } from 'db';
import { InvalidStateError, onError, onNoMatch } from 'lib/middleware';
import { getNFTs } from 'lib/nft/getNfts';
import { GetNftsResponse } from 'lib/nft/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNfts);

async function getNfts (req: NextApiRequest, res: NextApiResponse<GetNftsResponse | {error: string}>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;

  const hiddenNftIds: string[] = (await prisma.profileItem.findMany({
    where: {
      userId,
      isHidden: true,
      type: 'nft'
    },
    select: {
      id: true
    }
  })).map(p => p.id);

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      addresses: true
    }
  });

  if (!user) {
    throw new InvalidStateError('User not found');
  }

  const { addresses } = user;
  const mappedNfts = await getNFTs(addresses);
  const hiddenNfts = mappedNfts.filter((nft) => hiddenNftIds.includes(nft.tokenId));
  const visibleNfts = mappedNfts.filter((nft) => !hiddenNftIds.includes(nft.tokenId));

  res.status(200).json({
    hiddenNfts,
    visibleNfts
  });
}

export default withSessionRoute(handler);
