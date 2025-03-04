import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { optimism } from 'viem/chains';
// console.log('current week', getCurrentWeek());
import { parseEther } from 'viem';

const account = process.env.ACCOUNT;
const privateKey = process.env.PRIVATE_KEY;

const token = '0x4200000000000000000000000000000000000042';
const toAddress = '0x5A7E40a841820187450ae4374b7eFc7611520218';

async function query() {
  // write a query to return all the bonus partners from the github repo table
  const walletClient = getWalletClient({
    chainId: optimism.id,
    privateKey: privateKey
  });

  const balance = await walletClient.readContract({
    address: token,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [account]
  });

  // console.log('Token balance:', balance);
  // return;
  const tx = await walletClient.writeContract({
    address: token,
    abi: [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'recipient', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ type: 'bool' }]
      }
    ],
    functionName: 'transfer',
    args: [toAddress, parseEther('200')]
  });

  console.log('Transaction hash:', tx);
}

query();
