import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshShareImage } from '@packages/scoutgame/builders/refreshShareImage';

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const builderId = searchParams.get('builderId') ?? (await request.json()).builderId;

  if (!stringUtils.isUUID(builderId)) {
    return new Response('builderId is not defined', { status: 400 });
  }

  try {
    const existingNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        builderId,
        season: getCurrentSeasonStart(),
        nftType: BuilderNftType.default
      }
    });

    await refreshShareImage(existingNft);

    return Response.json({});
  } catch (error) {
    log.error('Error refreshing share image', { error, builderId });
    return new Response(`Unknown error: ${(error as Error).message}`, { status: 500 });
  }
}
