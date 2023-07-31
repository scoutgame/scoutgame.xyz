import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { signJwt } from 'lib/webhookPublisher/authentication';
import { createSigningSecret } from 'lib/webhookPublisher/subscribeToEvents';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(testSpaceWebhook);

async function testSpaceWebhook(req: NextApiRequest, res: NextApiResponse<{ status: number }>) {
  const { id: spaceId } = req.query;

  const { webhookUrl } = req.body as { webhookUrl: string };
  const signingSecret = createSigningSecret();
  const secret = Buffer.from(signingSecret, 'hex');
  const webhookData = {
    event: 'test',
    spaceId,
    createdAt: new Date().toISOString()
  };
  const signedJWT = await signJwt('webhook', webhookData, secret);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(webhookData),
      headers: {
        Signature: signedJWT
      }
    });

    return res.status(200).json({
      status: response.status
    });
  } catch (error) {
    return res.status(200).json({
      status: 500
    });
  }
}

export default withSessionRoute(handler);
