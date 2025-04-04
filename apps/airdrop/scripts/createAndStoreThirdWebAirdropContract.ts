import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract, Recipient } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

const recipients: Recipient[]= [
  {
    address: '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0',
    amount: parseEther('100').toString(),
  },
  {
    address: '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d',
    amount: parseEther('50').toString(),
  },
  {
    address: '0x6866C5669592D79c1010Ee9d0936F6A3a800133d',
    amount: parseEther('25').toString(),
  }
]

export type FullMerkleTree = {
  rootHash: string;
  recipients: Recipient[];
  layers: string[];
  totalAirdropAmount: string;
  totalRecipients: number;
  proofMaxQuantityForWallet: string;
}

export async function createAndStoreThirdWebAirdropContract() {
  const {airdropContractAddress, deployTxHash, cid, merkleTree} = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.PRIVATE_KEY as `0x${string}`,
    chainId: base.id,
    // 30 days in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)),
    implementationAddress: '0x0f2f02D8fE02E9C14A65A5A33073bD1ADD9aa53B',
    proxyFactoryAddress: '0x25548ba29a0071f30e4bdcd98ea72f79341b07a1',
    tokenAddress: '0xfcdc6813a75df7eff31382cb956c1bee4788dd34',
    recipients,
  });

  await prisma.airdropClaim.create({
    data: {
      chainId: base.id,
      contractAddress: airdropContractAddress,
      deployTxHash,
      ipfsCid: cid,
      merkleTreeJson: {
        rootHash: merkleTree.rootHash,
        recipients: merkleTree.recipients,
        layers: merkleTree.layers,
        totalAirdropAmount: merkleTree.totalAirdropAmount.toString(),
        totalRecipients: merkleTree.totalRecipients,
        proofMaxQuantityForWallet: merkleTree.proofMaxQuantityForWallet.toString(),
      },
      season: getCurrentSeasonStart(),
    }
  })
}

createAndStoreThirdWebAirdropContract()