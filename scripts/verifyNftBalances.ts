import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

import { resolveTokenOwnership } from '@packages/scoutgame/protocol/resolveTokenOwnership';

async function query() {
  const tokenBalances = await resolveTokenOwnership({
    week: '2025-W20',
    chainId: 8453
  });
  prettyPrint(tokenBalances);
  // return;
  const nfts = await prisma.builderNft.findMany({
    where: {
      season: '2025-W18'
    },
    include: {
      nftOwners: true
    }
  });
  console.log(nfts.length);
  let missing = 0;
  let incorrect = 0;
  let correct = 0;
  for (const nft of nfts) {
    // @ts-ignore
    const owners = (nft.nftType === 'default' ? tokenBalances.standard : tokenBalances.starter)[nft.tokenId.toString()];
    const ownerAddresses = Object.keys(owners || {});
    let handled: Record<string, boolean> = {};
    for (const owner of ownerAddresses) {
      handled[owner] = true;
      const dbRecord = nft.nftOwners.find((o) => o.walletAddress === owner);
      if (!dbRecord) {
        missing++;
        console.error(`Missing a record for ${nft.tokenId} owned by ${owner}`);
      } else if (dbRecord.balance !== owners[owner]) {
        incorrect++;
        console.error(`Mismatch for ${nft.tokenId} owned by ${owner}. ${dbRecord.balance} !== ${owners[owner]}`);
        console.log(
          'updated',
          await prisma.scoutNft.update({
            where: {
              builderNftId_walletAddress: {
                builderNftId: nft.id,
                walletAddress: owner
              }
            },
            data: {
              balance: owners[owner]
            }
          })
        );
      } else {
        correct++;
      }
    }
    const nftOwnersMissing = nft.nftOwners.filter((o) => o.balance && !owners?.[o.walletAddress]);
    if (nftOwnersMissing.length > 0) {
      console.error(
        `NFT ${nft.tokenId} (${nft.nftType}) has ${nftOwnersMissing.length} owners missing from onchain records`
      );
      console.log(nft.nftOwners);
      // for (const owner of nftOwnersMissing) {
      //   console.error(`  ${owner.walletAddress} ${owner.balance}`);
      // }
    }
  }
  console.log(`Missing: ${missing}`);
  console.log(`Incorrect: ${incorrect}`);
  console.log(`Correct: ${correct}`);
}
query();
