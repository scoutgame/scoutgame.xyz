import env from '@beam-australia/react-env';
import type { Address } from 'viem';

export const NULL_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';
export const AIRDROP_SAFE_WALLET = '0x78Ef4aFbE2BC6DF76B696c71fC1CeDCA4aD31561';
export const SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS =
  (env('SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS') as Address) ||
  (process.env.REACT_APP_SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS as Address);

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';
