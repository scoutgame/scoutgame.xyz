import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract, Recipient } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { parseEther } from 'viem';
import { base } from 'viem/chains';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

const recipients: Recipient[] = [
  {
    address: '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0',
    amount: parseEther('10').toString()
  },
  {
    address: '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d',
    amount: parseEther('20').toString()
  },
  {
    address: '0x5781cb3b80822eeac045b153ba96d6e5cf38dafb',
    amount: parseEther('10').toString()
  }
];

export async function createAndStoreThirdWebAirdropContract() {
  const previousSeason = getPreviousSeason(getCurrentSeasonStart());

  if (!previousSeason) {
    throw new Error('No previous season found');
  }

  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.PRIVATE_KEY as `0x${string}`,
    chainId: base.id,
    // 1 year in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365),
    tokenAddress: '0xfcdc6813a75df7eff31382cb956c1bee4788dd34',
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
      season: previousSeason
    }
  });
}

createAndStoreThirdWebAirdropContract();
