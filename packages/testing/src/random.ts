import { randomBytes } from 'node:crypto';

import type { Address } from 'viem';
import { keccak256 } from 'viem/utils';

export function generateRandomEthAddress(): Address {
  const privateKey = randomBytes(32); // Generate 32 random bytes
  const publicKey = keccak256(privateKey).slice(2); // Keccak-256 hash and remove '0x'
  const address = `0x${publicKey.slice(-40)}` as Address; // Take the last 40 characters (20 bytes) for the address
  return address;
}
