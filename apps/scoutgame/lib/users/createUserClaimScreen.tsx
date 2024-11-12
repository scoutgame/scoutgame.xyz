import { S3Client, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '@charmverse/core/prisma-client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { getS3ClientConfig } from '@packages/aws/getS3ClientConfig';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { baseUrl } from '@root/config/constants';
import puppeteer from 'puppeteer';
import React from 'react';

import { getUnclaimedPointsSource } from 'lib/points/getUnclaimedPointsSource';

import { PointsClaimBuilderScreen } from '../../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';
import { serverTheme } from '../../theme/serverTheme';

const client = new S3Client(getS3ClientConfig());

export async function createUserClaimScreen(userId: string) {
  const { renderToString } = await import('react-dom/server');

  const user = await prisma.scout.findUniqueOrThrow({
    where: { id: userId },
    select: {
      displayName: true
    }
  });
  const { builders, builderPoints, scoutPoints, repos } = await getUnclaimedPointsSource(userId);
  const browser = await puppeteer.launch({
    // This is required to load the fonts
    args: ['--disable-web-security']
  });
  const isBuilder = builders.length > 0;
  const claimedPoints = builderPoints + scoutPoints;
  const displayName = user.displayName;

  try {
    const component = (
      <ThemeProvider theme={serverTheme}>
        <CssBaseline />
        {isBuilder ? (
          <PointsClaimBuilderScreen displayName={displayName} claimedPoints={claimedPoints} repos={repos} />
        ) : (
          <PointsClaimScoutScreen displayName={displayName} claimedPoints={claimedPoints} builders={builders} />
        )}
      </ThemeProvider>
    );

    const renderedHtml = renderToString(component);

    const html = `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'Posterama';
            src: url('${baseUrl}/fonts/Posterama-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'K2D';
            src: url('${baseUrl}/fonts/K2D-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }
        </style>
      </head>
      <body>
        <div id="root">
          <img src="${baseUrl}/images/claim-share-background.png" alt="Claim share background" width="600" height="600" style="position: absolute; top: 0; left: 0;" />
          ${renderedHtml}
        </div>
      </body>
    </html>
  `;

    const page = await browser.newPage();

    await page.setViewport({ width: 600, height: 600 });
    await page.setContent(html);
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForSelector('.scoutgame-claim-screen', { visible: true });
    await page.waitForNetworkIdle();

    const screenshot = await page.screenshot();

    const params: PutObjectCommandInput = {
      Bucket: process.env.SCOUTGAME_S3_BUCKET,
      Key: `claim-screens/${userId}/${getCurrentWeek()}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    };

    const s3Upload = new Upload({
      client,
      params
    });

    await s3Upload.done();
  } finally {
    await browser.close();
  }
}
