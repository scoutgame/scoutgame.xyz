import env from '@beam-australia/react-env';
import type { Address } from 'viem';
import { base } from 'viem/chains';

// If we are onchain or not in preseason, use base, otherwise use optimism
export const scoutProtocolChain = base; // optimism;

export const devTokenContractAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c' as Address;

export const minterPrivateKey = process.env.BUILDER_SMART_CONTRACT_MINTER_PRIVKEY as string;

export const scoutProtocolChainId = scoutProtocolChain.id;

export const devTokenDecimals = 18;
export const devTokenSymbol = 'DEV';
export const devTokenChain = base;

export const protocolStartBlock = 19_000_000;

// Selecting the top 100 builders
export const weeklyRewardableBuilders = 100;

/**
 * $SCOUT has 18 decimals
 */
export const devTokenDecimalsMultiplier = BigInt('1000000000000000000');

export const scoutProtocolAddress = (env('SCOUTPROTOCOL_CONTRACT_ADDRESS') ||
  process.env.REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS) as Address;
