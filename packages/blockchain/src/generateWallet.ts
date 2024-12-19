import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { keccak256 } from 'viem/utils';

function privateKeyFromSeed(seed: string) {
  // Step 1: Hash the UUID using keccak256
  const uuidHash = keccak256(new TextEncoder().encode(seed));

  // Step 2: Truncate or pad the hash to ensure it's exactly 32 bytes (64 hex characters)
  // Ethereum private keys are 32 bytes long (256 bits)
  const privateKey = `0x${uuidHash.slice(2, 66)}`; // Remove '0x' and keep the first 64 hex characters

  // Step 3: Return the private key
  return privateKey as `0x${string}`;
}

export function generateWallet(seed?: string) {
  const key = seed ? privateKeyFromSeed(seed) : generatePrivateKey();

  const account = privateKeyToAccount(key);

  const wallet = { key, account: account.address };

  return wallet;
}
