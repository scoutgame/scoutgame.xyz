import fs from 'fs';
import path from 'path';
import { encodeFunctionData, getAddress, erc20Abi, isAddress, parseUnits } from 'viem';
import type { MetaTransactionData } from '@safe-global/types-kit';
import { OperationType } from '@safe-global/types-kit';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import { formatUnits } from 'ethers';

const MISSING_BIDS_FILE = 'draft-missing-bids-export.json';
const LOSERS_FILE = 'draft-losers.json';
const PAYOUTS_FILE = 'draft-payout.json';
const OUTPUT_FILE = 'payout-transactions-final.json';
const REFUNDS_FILE = 'refunds.json';

type DraftPayout = {
  walletAddress: string;
  amount: number; 
};

type DraftMissingBid = {
  walletAddress: string;
  amount: string; 
};

type DraftLoser = {
  walletAddress: string;
  amount: number; 
};

type DraftRefund = {
  walletAddress: string;
  amount: number;
};

async function generatePayoutTransactions() {
  const basePath = path.join(process.cwd(), 'scripts/draft');
  const outputFilepath = path.join(basePath, OUTPUT_FILE);

  const draftMissingBids: DraftMissingBid[] = JSON.parse(fs.readFileSync(path.join(basePath, MISSING_BIDS_FILE), 'utf8'));
  const draftLosers: DraftLoser[] = JSON.parse(fs.readFileSync(path.join(basePath, LOSERS_FILE), 'utf8'));
  const draftPayouts: DraftPayout[] = JSON.parse(fs.readFileSync(path.join(basePath, PAYOUTS_FILE), 'utf8'));
  const draftRefunds: DraftRefund[] = JSON.parse(fs.readFileSync(path.join(basePath, REFUNDS_FILE), 'utf8'));
  const userTokensRecord: Record<string, bigint> = {};

  const addToRecord = (address: string, amount: bigint) => {
    try {
      const normalizedAddress = getAddress(address.toLowerCase());
      if (!userTokensRecord[normalizedAddress]) {
        userTokensRecord[normalizedAddress] = BigInt(0);
      }
      userTokensRecord[normalizedAddress] += amount;
    } catch (error) {
        console.warn(`Skipping invalid address ${address}: ${error}`);
    }
  };

  for (const draftPayout of draftPayouts) {
    addToRecord(draftPayout.walletAddress, parseUnits(draftPayout.amount.toString(), 18));
  }

  for (const draftMissingBid of draftMissingBids) {
    addToRecord(draftMissingBid.walletAddress, parseUnits(draftMissingBid.amount, 18));
  }
  
  for (const draftLoser of draftLosers) {
    addToRecord(draftLoser.walletAddress, parseUnits(draftLoser.amount.toString(), 18));
  }

  for (const draftRefund of draftRefunds) {
    addToRecord(draftRefund.walletAddress, parseUnits(draftRefund.amount.toString(), 18));
  }

  // Prepare Safe Transaction Data
  const payoutTransactions: MetaTransactionData[] = [];
  let totalPayout = BigInt(0);
  let includedPayouts = 0;

  for (const [address, amount] of Object.entries(userTokensRecord)) {
    if (amount > BigInt(0)) {
        // Double check address validity before encoding
        if (!isAddress(address)) {
            console.warn(`Final check failed: Skipping invalid address ${address} during transaction generation.`);
            continue;
        }

      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [address, amount]
      });

      const transaction: MetaTransactionData = {
        to: getAddress(devTokenContractAddress),
        value: '0',
        data: transferData,
        operation: OperationType.Call
      };

      payoutTransactions.push(transaction);
      totalPayout += amount;
      includedPayouts++;
    }
  }

  console.log(`Total Payout Amount (smallest unit): ${formatUnits(totalPayout, 18)}`);
  console.log(`Total Transactions Generated: ${includedPayouts} for ${Object.keys(userTokensRecord).length} unique valid addresses initially processed`);

  // Write the final transactions to a JSON file
  fs.writeFileSync(outputFilepath, JSON.stringify({
    version: '1.0',
    chainId: 8453,
    createdAt: Date.now(),
    meta: {
      txBuilderVersion: '1.17.1'
    },
    transactions: payoutTransactions
  }, null, 2));
  console.log(`Payout transactions data saved to ${outputFilepath}`);
}

generatePayoutTransactions().catch((error) => {
  console.error('Error generating payout transactions:', error);
  process.exit(1);
});