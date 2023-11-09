import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { createBlocks } from 'lib/rewards/blocks/createBlocks';
import { deleteBlocks } from 'lib/rewards/blocks/deleteBlocks';
import { getBlocks } from 'lib/rewards/blocks/getBlocks';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields
} from 'lib/rewards/blocks/interfaces';
import { updateBlocks } from 'lib/rewards/blocks/updateBlocks';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getRewardBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(createRewardBlocksHandler)
  .put(updateRewardBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .delete(deleteRewardBlocksHandler);

async function getRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<RewardBlockWithTypedFields[]>) {
  const spaceId = req.query.id as string;
  const blockId = req.query.blockId as string;

  const rewardBlocks = await getBlocks({
    spaceId,
    ids: blockId ? [blockId] : undefined
  });

  return res.status(200).json(rewardBlocks);
}

async function createRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<RewardBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as RewardBlockInput[];

  const rewardBlocks = await createBlocks({
    blocksData: data,
    userId,
    spaceId: req.query.id as string
  });

  return res.status(200).json(rewardBlocks);
}

async function updateRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<RewardBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as RewardBlockUpdateInput[];
  const spaceId = req.query.id as string;

  const rewardBlocks = await updateBlocks({
    blocksData: data,
    userId,
    spaceId
  });

  return res.status(200).json(rewardBlocks);
}

async function deleteRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const userId = req.session.user.id;
  const data = req.body as string[];

  await deleteBlocks({
    blocksData: data,
    userId,
    spaceId: req.query.id as string
  });

  return res.status(200).json(data);
}

export default withSessionRoute(handler);
