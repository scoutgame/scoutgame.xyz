import { randomBytes } from 'node:crypto';

import type { Season } from '@packages/dates/config';
import { getLastWeek, getCurrentWeek } from '@packages/dates/utils';
import type { Address } from 'viem';
import { keccak256 } from 'viem/utils';

export const randomLargeInt = (decimals = 6) => Math.floor(Math.random() * 100 * 10 ** decimals) + 100 * 10 ** decimals;

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomWalletAddress(): Address {
  const privateKey = randomBytes(32); // Generate 32 random bytes
  const publicKey = keccak256(privateKey as unknown as `0x${string}`).slice(2); // Keccak-256 hash and remove '0x'
  const address = `0x${publicKey.slice(-40)}` as Address; // Take the last 40 characters (20 bytes) for the address
  return address;
}

// provide a basic season for testing that doesn't rely on the hard-coded "current season"
export const mockSeason = getLastWeek() as Season;
export const mockWeek = getCurrentWeek();
