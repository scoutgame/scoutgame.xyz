import { getChainById } from '@packages/blockchain/chains';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import type { Chain } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { generateMerkleTreeInfoERC20, airdropERC20 } from 'thirdweb/extensions/airdrop';
import type { AccessList, AuthorizationList, SignedAuthorization } from 'viem';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

async function generateMerkleRoot() {
  const snapshot = [
    { recipient: '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d', amount: parseEther('100') },
    { recipient: '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0', amount: parseEther('200') },
    { recipient: '0x6866C5669592D79c1010Ee9d0936F6A3a800133d', amount: parseEther('150') }
  ];

  const chain = getChainById(base.id);

  if (!chain) {
    throw new Error('Chain not found');
  }

  const tokenAddress = '0xfcdc6813a75df7eff31382cb956c1bee4788dd34';

  const client = createThirdwebClient({
    clientId: process.env.THIRDWEB_CLIENT_ID as string,
    secretKey: process.env.THIRDWEB_SECRET_KEY as string
  });

  const modifiedChain: Chain = {
    ...chain,
    id: base.id,
    testnet: true,
    rpc: chain.rpcUrls[0]
  };

  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  });

  if (!walletClient.account) {
    throw new Error('Wallet not found');
  }

  // Generate merkle tree info
  const { merkleRoot, snapshotUri } = await generateMerkleTreeInfoERC20({
    contract: {
      address: tokenAddress,
      client,
      chain: modifiedChain
    },
    tokenAddress,
    snapshot: snapshot.map((item) => ({
      recipient: item.recipient,
      amount: item.amount.toString()
    }))
  });

  const transaction = airdropERC20({
    contract: {
      address: tokenAddress,
      client,
      chain: modifiedChain
    },
    tokenAddress,
    contents: snapshot,
    asyncParams: async () => {
      return {
        tokenAddress,
        contents: snapshot
      };
    }
  });

  const result = await walletClient.sendTransaction({
    account: walletClient.account,
    to: tokenAddress,
    data: transaction.data as `0x${string}`,
    value: transaction.value as bigint,
    gas: transaction.gas as bigint,
    nonce: transaction.nonce as number,
    chain: base,
    accessList: transaction.accessList as AccessList,
    maxFeePerGas: transaction.maxFeePerGas as bigint,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas as bigint
  });

  console.log('Transaction Hash:', result);
  console.log('Merkle Root:', merkleRoot);
  console.log('Snapshot URI:', snapshotUri);

  return { merkleRoot, snapshotUri };
}

generateMerkleRoot();
