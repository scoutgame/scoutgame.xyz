import type { TransactionReceipt, PublicClient } from 'viem';
import { TransactionReceiptNotFoundError } from 'viem';
// Note the difference between this and the waitForTransactionReceipt function in the viem package
// This function does a retry when waiting for the receipt, not just the transaction!
// @source: https://github.com/wevm/viem/issues/3515
// @viem source: https://github.com/wevm/viem/blob/main/src/actions/public/waitForTransactionReceipt.ts#L229
async function waitForTransactionReceipt(
  client: PublicClient,
  txnHash: `0x${string}`,
  timeoutMs: number,
  pollingIntervalMs: number = 4_000,
  confirmations: number = 1
): Promise<TransactionReceipt | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const receipt = await client.getTransactionReceipt({ hash: txnHash });
      if (receipt?.blockNumber != null) {
        if (confirmations <= 1) {
          return receipt;
        }

        const latestBlock = await client.getBlockNumber();
        const confirmationsMet = latestBlock - receipt.blockNumber + 1n >= BigInt(confirmations);
        if (confirmationsMet) {
          return receipt;
        }

        // Otherwise, continue polling for more confirmations
      }
    } catch (error: any) {
      if (!(error instanceof TransactionReceiptNotFoundError)) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));
  }

  return null; // timeout reached
}
