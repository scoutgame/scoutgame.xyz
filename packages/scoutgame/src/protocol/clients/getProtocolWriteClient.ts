import { scoutProtocolAddress } from '../constants';
import type { ReadWriteWalletClient } from '../contracts/ScoutProtocolImplementation';
import { ScoutProtocolImplementationClient } from '../contracts/ScoutProtocolImplementation';

export function getProtocolWriteClient({ walletClient }: { walletClient: ReadWriteWalletClient }) {
  return new ScoutProtocolImplementationClient({
    contractAddress: scoutProtocolAddress,
    walletClient
  });
}
