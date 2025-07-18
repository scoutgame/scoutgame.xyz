import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { getClaimableTokensWithSources } from '@packages/scoutgame/tokens/getClaimableTokensWithSources';
import { baseUrl } from '@packages/utils/constants';
import puppeteer from 'puppeteer';

import { TokensClaimBuilderScreen } from 'components/claim/components/TokensClaimScreen/TokensClaimModal/TokensClaimBuilderScreen';
import { TokensClaimScoutScreen } from 'components/claim/components/TokensClaimScreen/TokensClaimModal/TokensClaimScoutScreen';

export async function createUserClaimScreen({ userId, week }: { userId: string; week: string }) {
  const { renderToString } = await import('react-dom/server');

  const user = await prisma.scout.findUniqueOrThrow({
    where: { id: userId },
    select: {
      displayName: true
    }
  });
  const { developers, tokens: claimedTokens, repos } = await getClaimableTokensWithSources(userId);
  const browser = await puppeteer.launch({
    // These flags are required to load the fonts and run the browser inside docker container
    args: ['--disable-web-security', '--disable-setuid-sandbox', '--no-sandbox']
  });
  const isBuilder = repos.length > 0;
  const displayName = user.displayName;

  try {
    const component = isBuilder ? (
      <TokensClaimBuilderScreen
        displayName={displayName}
        claimedTokens={claimedTokens}
        repos={repos}
        // Need to pass baseUrl to the component to load the fonts and images
        baseUrl={baseUrl}
      />
    ) : (
      <TokensClaimScoutScreen
        displayName={displayName}
        claimedTokens={claimedTokens}
        developers={developers}
        baseUrl={baseUrl}
      />
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

          body {
            font-family: 'Inter', sans-serif;
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

    const screenshot = Buffer.from(await page.screenshot());

    await uploadFileToS3({
      pathInS3: `tokens-claim/${userId}/${week}.png`,
      bucket: process.env.S3_UPLOAD_BUCKET,
      content: screenshot,
      contentType: 'image/png'
    });

    log.info('generated claim screen', { userId });
  } catch (e) {
    log.error('error generating claim screen', { userId, error: e });
  } finally {
    await browser.close();
  }
}
