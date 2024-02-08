import { ExternalServiceError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { Frame, FrameActionPayload, FrameButton } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(getNextFrame);

export type FrameActionResponse =
  | {
      location: string | null;
    }
  | {
      frame: Frame | null;
    };

export type FrameActionRequest = {
  frameAction: FrameActionPayload;
  postType: FrameButton['action'];
  pageId?: string;
};

const requestTimeout = 7500;

async function getNextFrame(req: NextApiRequest, res: NextApiResponse<FrameActionResponse>) {
  const { frameAction, postType } = req.body as FrameActionRequest;
  const userId = req.session.user?.id;
  const url = frameAction.untrustedData.url;
  const pageId = req.query.pageId as string | undefined;

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    redirect: postType === 'post_redirect' ? 'manual' : undefined,
    body: JSON.stringify(frameAction)
  });

  const result = await Promise.race([
    fetchPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), requestTimeout);
    })
  ]);

  if (result instanceof Error) {
    throw new ExternalServiceError('Request timed out');
  }

  const response = result as Response;

  if (pageId) {
    const space = await prisma.page.findUniqueOrThrow({
      where: {
        id: pageId
      },
      select: {
        spaceId: true
      }
    });

    const spaceId = space.spaceId;
    trackUserAction('interact_farcaster_frame', {
      userId,
      spaceId,
      pageId
    });
  }

  if (response.status === 302) {
    return res.status(302).json({
      location: response.headers.get('location')
    });
  }

  const htmlString = await response.text();

  const frame = getFrame({ htmlString, url });

  if (!frame) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  const frameImage = frame.image;

  if (frameImage && frameImage.includes('svg')) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  return res.status(200).json({ frame });
}

export default withSessionRoute(handler);
