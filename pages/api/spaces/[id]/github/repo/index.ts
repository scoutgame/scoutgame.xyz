import type { RewardsGithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).post(connectGithubRepoWithReward);

export type ConnectRewardGithubRepoPayload = {
  rewardTemplateId: string;
  repositoryId: string;
  repositoryName: string;
  rewardAuthorId: string;
  repositoryLabels: string[];
};

async function connectGithubRepoWithReward(req: NextApiRequest, res: NextApiResponse<RewardsGithubRepo>) {
  const spaceId = req.query.id as string;
  const { repositoryId, rewardTemplateId, repositoryName, repositoryLabels, rewardAuthorId } =
    req.body as ConnectRewardGithubRepoPayload;

  const spaceGithubCredential = await prisma.spaceGithubCredential.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      id: true,
      name: true,
      installationId: true
    }
  });

  const rewardsGithubRepo = await prisma.rewardsGithubRepo.create({
    data: {
      repositoryId,
      repositoryName,
      rewardTemplateId,
      rewardAuthorId,
      repositoryLabels,
      credentialId: spaceGithubCredential.id
    }
  });

  return res.status(200).json(rewardsGithubRepo);
}

export default withSessionRoute(handler);
