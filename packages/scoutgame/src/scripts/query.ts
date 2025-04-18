import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { uploadArtwork } from '../builderNfts/artwork/uploadArtwork';
import { uploadMetadata } from '../builderNfts/artwork/uploadMetadata';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = getCurrentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const nfts = await prisma.builderNft.findMany({
    where: {
      season: getCurrentSeasonStart(),
      builder: {
        avatar: {
          not: null
        }
      }
    },
    include: {
      builder: true
    }
  });

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    console.log('Processing NFT', nft.tokenId, `--- ${i + 1} / ${nfts.length}`);
    await uploadArtwork({
      displayName: nft.builder.displayName,
      season: getCurrentSeasonStart(),
      avatar: nft.builder.avatar as string,
      tokenId: nft.tokenId
    });

    await uploadMetadata({
      season: getCurrentSeasonStart(),
      tokenId: nft.tokenId,
      path: nft.builder.path!
    });
  }
}

// query();
