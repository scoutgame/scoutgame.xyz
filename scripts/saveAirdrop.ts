import { prisma } from '@charmverse/core/prisma-client';
import { base } from 'viem/chains';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

// load meta
import meta from '../safe-transaction-meta.json';

const season = getCurrentSeasonStart();

async function saveAirdrop() {
  await prisma.airdropClaim.deleteMany({
    where: {
      season
    }
  });
  const { fileUrl } = await uploadFileToS3({
    pathInS3: `airdrop-contracts/${meta.contractAddress}.json`,
    content: Buffer.from(JSON.stringify(meta.merkleTree)),
    bucket: process.env.S3_UPLOAD_BUCKET,
    contentType: 'application/json'
  });
  console.log('Uploaded merkle tree to S3', fileUrl);
  const airdropClaim = await prisma.airdropClaim.create({
    data: {
      chainId: base.id,
      contractAddress: meta.contractAddress,
      deployTxHash: meta.deployTxHash,
      merkleTreeUrl: fileUrl,
      blockNumber: Number(meta.blockNumber),
      season
    }
  });
  console.log('Created airdrop claim', season);
}

saveAirdrop();
