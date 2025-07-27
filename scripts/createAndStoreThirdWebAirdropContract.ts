import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract, Recipient } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { parseEther } from 'viem';
import { base } from 'viem/chains';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const airdropList = JSON.parse(fs.readFileSync(path.join(__dirname, 'airdrop.json'), 'utf8')) as {
  address: `0x${string}`;
  totalSeason2Airdrop: number;
}[];

const recipients: Recipient[] = airdropList.filter(item => item.totalSeason2Airdrop > 0).map(item => ({
  address: item.address,
  amount: parseEther(item.totalSeason2Airdrop.toString()).toString()
}));

export async function createAndStoreThirdWebAirdropContract() {
  const previousSeason = getPreviousSeason(getCurrentSeasonStart());

  if (!previousSeason) {
    throw new Error('No previous season found');
  }

  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.PRIVATE_KEY as `0x${string}`,
    chainId: base.id,
    // 3 months from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90),
    tokenAddress: devTokenContractAddress,
    recipients
  });

  const { fileUrl } = await uploadFileToS3({
    pathInS3: `airdrop-contracts/${airdropContractAddress}.json`,
    content: Buffer.from(JSON.stringify(merkleTree)),
    bucket: process.env.S3_UPLOAD_BUCKET,
    contentType: 'application/json'
  });

  await prisma.airdropClaim.create({
    data: {
      chainId: base.id,
      contractAddress: airdropContractAddress,
      deployTxHash,
      merkleTreeUrl: fileUrl,
      blockNumber,
      season: '2025-W18'
    }
  });
}

// createAndStoreThirdWebAirdropContract();