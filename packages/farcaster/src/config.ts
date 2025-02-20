import { getAlchemyBaseUrl } from '@packages/blockchain/provider/alchemy/client';
import type { Hex } from 'viem';
import { optimism } from 'viem/chains';
import * as yup from 'yup';

export const authConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'scoutgame.xyz',
  siweUri: 'https://scoutgame.xyz/login',
  provider: optimism
} as const;

export function getAuthConfig() {
  const config = {
    relay: 'https://relay.farcaster.xyz',
    rpcUrl: optimism.rpcUrls.default.http[0],
    domain: 'scoutgame.xyz',
    siweUri: 'https://scoutgame.xyz/login',
    provider: optimism
  };
  try {
    const optimismRpc = getAlchemyBaseUrl(optimism.id);
    return {
      ...config,
      rpcUrl: optimismRpc
    };
  } catch (_) {
    return config;
  }
}

export const authSchema = yup.object({
  nonce: yup.string().defined(),
  message: yup.string().required(),
  signature: yup.string<Hex>().required(),
  // used by webapp to track referrals
  inviteCode: yup.string().optional().nullable(),
  referralCode: yup.string().optional().nullable(),
  utmCampaign: yup.string().optional().nullable()
  // state: yup.string<'pending' | 'completed'>().defined().oneOf(['pending', 'completed']),
  // custody: yup.string<Hex>().required()
});

export type AuthSchema = yup.InferType<typeof authSchema>;
