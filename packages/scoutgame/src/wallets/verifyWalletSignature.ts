import { log } from '@charmverse/core/log';
import { SiweMessage } from 'siwe';

import type { WalletAuthData } from './connectWalletAccountSchema';

export async function verifyWalletSignature({
  message,
  signature
}: WalletAuthData): Promise<{ walletAddress: string }> {
  try {
    const siweMessage = new SiweMessage(message);
    const verifiedMessage = await siweMessage.verify({ signature });

    if (verifiedMessage?.error || !verifiedMessage.success || !verifiedMessage.data?.address) {
      throw new Error('Invalid wallet signature');
    } else {
      return { walletAddress: verifiedMessage.data.address };
    }
  } catch (err: any) {
    log.warn('Error verifying wallet signature', { error: err });
    throw new Error('Invalid wallet signature');
  }
}
