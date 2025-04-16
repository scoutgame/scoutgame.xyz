import env from '@beam-australia/react-env';
import type { Address } from 'viem';

export const NULL_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';
export const AIRDROP_SAFE_WALLET = '0xCca0eeC96541fdC2D5C2D8BC93eeda7D3d2E7Aa4'; // grants.scoutgame.eth
export const SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS =
  (env('SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS') as Address) ||
  (process.env.REACT_APP_SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS as Address);

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';
