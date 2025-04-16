import env from '@beam-australia/react-env';
import type { Address } from 'viem';

export const NULL_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';
export const AIRDROP_SAFE_WALLET = '0x78Ef4aFbE2BC6DF76B696c71fC1CeDCA4aD31561';
export const SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS =
  (env('SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS') as Address) ||
  (process.env.REACT_APP_SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS as Address);

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

// TALENT token address on Base (placeholder for DEV token)
// TODO: Replace with DEV token address once its launched
export const DEV_TOKEN_ADDRESS = '0x9a33406165f562E16C3abD82fd1185482E01b49a';
export const OPTIMISM_USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// TODO: Replace with 100 tokens post launch
export const MIN_DEV_BID = 1; // Minimum bid is 100 DEV tokens
