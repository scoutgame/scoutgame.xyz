import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract, Recipient } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { parseEther } from 'viem';
import { base } from 'viem/chains';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';

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
    address: '0x6866C5669592D79c1010Ee9d0936F6A3a800133d',
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
      season: previousSeason
    }
  });
}

createAndStoreThirdWebAirdropContract();