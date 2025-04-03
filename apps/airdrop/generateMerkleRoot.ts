import { getChainById } from '@packages/blockchain/chains';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { createThirdwebClient } from 'thirdweb';
import { generateMerkleTreeInfoERC20 } from 'thirdweb/extensions/airdrop';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

import { deployAirdropContract } from './utils/airdropClaim';

async function generateMerkleRoot() {
  const snapshot = [
    { recipient: '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d', amount: parseEther('100') },
    { recipient: '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0', amount: parseEther('200') },
    { recipient: '0x6866C5669592D79c1010Ee9d0936F6A3a800133d', amount: parseEther('150') }
  ];

  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  const tokenAddress = '0xfcdc6813a75df7eff31382cb956c1bee4788dd34';
  const client = createThirdwebClient({
    clientId: process.env.THIRDWEB_CLIENT_ID as string,
    secretKey: process.env.THIRDWEB_SECRET_KEY as string
  });

  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  // Generate merkle tree info
  const { merkleRoot, snapshotUri } = await generateMerkleTreeInfoERC20({
    contract: {
      address: tokenAddress,
      client,
      chain: {
        ...chain,
        id: base.id,
        testnet: true,
        rpc: chain.rpcUrls[0]
      }
    },
    tokenAddress,
    snapshot: snapshot.map((item) => ({
      recipient: item.recipient,
      amount: item.amount.toString()
    }))
  });

  const airdropContractAddress = await deployAirdropContract({
    tokenAddress,
    merkleRoot: merkleRoot as `0x${string}`,
    totalAirdropAmount: snapshot.reduce((acc, item) => acc + item.amount, BigInt(0)),
    // Unix timestamp after which tokens can't be claimed. Should be in seconds.
    expirationTimestamp: BigInt(Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000)), // 30 days from now in seconds
    // Set it to 0 to make it only claimable based off the merkle root
    openClaimLimitPerWallet: BigInt(0),
    trustedForwarders: [],
    proxyFactoryAddress: '0x25548ba29a0071f30e4bdcd98ea72f79341b07a1',
    implementationAddress: '0x0f2f02D8fE02E9C14A65A5A33073bD1ADD9aa53B'
    // Implementation: 0x0f2f02D8fE02E9C14A65A5A33073bD1ADD9aa53B
  });

  return { merkleRoot, snapshotUri };
}

generateMerkleRoot();
