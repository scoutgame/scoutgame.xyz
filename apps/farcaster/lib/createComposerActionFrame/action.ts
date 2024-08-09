'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';
import { v4 } from 'uuid';

import { actionClient } from 'lib/actionClient';

import { WeeklyUpdatesText } from '../../components/WeeklyUpdatesText';

import { schema } from './schema';

export const createComposerActionFrameAction = actionClient.schema(schema).action(async ({ parsedInput }) => {
  const element = React.createElement(WeeklyUpdatesText, { text: parsedInput.text });
  const image = new ImageResponse(element, {
    width: 1000,
    height: 525
  });

  const imageBlob = await image.blob();
  const imageData = await imageBlob.arrayBuffer().then((buffer) => Buffer.from(buffer));
  const optimizedBuffer = await sharp(imageData).webp({ quality: 100 }).toBuffer();
  const frameId = v4();
  const user = await prisma.user.findFirst({
    where: {
      farcasterUser: {
        fid: parsedInput.authorFid
      }
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new InvalidInputError(`Could not find user with fid ${parsedInput.authorFid}`);
  }

  const { fileUrl } = await uploadFileToS3({
    pathInS3: getUserS3FilePath({ userId: user.id, url: `frame-${frameId}` }),
    content: optimizedBuffer,
    contentType: 'image/webp'
  });

  const composerActionFrame = await prisma.composerActionFrame.create({
    data: {
      authorFid: parsedInput.authorFid,
      projectId: parsedInput.projectId,
      text: parsedInput.text,
      image: fileUrl
    }
  });

  return composerActionFrame;
});
