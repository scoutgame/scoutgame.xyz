'use client';

import env from '@beam-australia/react-env';
import farcasterConnector from '@farcaster/frame-wagmi-connector';
import { getAlchemyBaseUrl } from '@packages/blockchain/provider/alchemy/client';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  metaMaskWallet,
  safeWallet,
  coinbaseWallet
} from '@rainbow-me/rainbowkit/wallets';
import type { Chain, Transport } from 'viem';
import { http, cookieStorage, createStorage, fallback, createConfig } from 'wagmi';
import {
  arbitrum,
  arbitrumSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
  zora,
  zoraSepolia,
  base,
  baseSepolia
} from 'wagmi/chains';

// Create a single shared config instance to avoid config mismatch issues
let sharedConfig: ReturnType<typeof createConfig> | null = null;

export function getConfig(options?: { projectId?: string }) {
  // Return the same config instance to avoid "different config" issues
  if (sharedConfig) {
    return sharedConfig;
  }

  const projectId = options?.projectId || env('WALLETCONNECT_PROJECTID') || '';

  if (!projectId) {
    // WalletConnect projectId is missing - this may cause Rainbow wallet connection issues
  }

  const wagmiChains = [
    mainnet,
    sepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    arbitrum,
    arbitrumSepolia,
    zora,
    zoraSepolia
  ] as [Chain, ...Chain[]];

  const transports = wagmiChains.reduce<Record<string, Transport>>((acc, chain) => {
    try {
      const rpcUrl = getAlchemyBaseUrl(chain.id);
      acc[chain.id] = fallback([http(rpcUrl), http()]);
      return acc;
    } catch (_) {
      acc[chain.id] = http();
      return acc;
    }
  }, {});

  const connectors = connectorsForWallets(
    [
      // Reference: node_modules/@rainbow-me/rainbowkit/dist/index.js
      {
        groupName: 'Popular',
        wallets: [metaMaskWallet, rainbowWallet, safeWallet, coinbaseWallet, walletConnectWallet, injectedWallet]
      },
      {
        groupName: 'Other',
        wallets: [
          () => {
            return {
              createConnector: () => farcasterConnector(),
              iconBackground: '#000000',
              iconUrl: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/055c25d6-7fe7-4a49-abf9-49772021cf00/original',
              id: 'farcaster',
              name: 'Farcaster Frame',
              rdns: 'xyz.farcaster',
              installed: true
            };
          }
        ]
      }
    ],
    {
      appName: 'Scout Game',
      projectId,
      appDescription: 'Scout Game',
      appUrl: 'https://scoutgame.xyz',
      appIcon: 'https://scoutgame.xyz/images/farcaster/fc_icon.png',
      walletConnectParameters: {
        metadata: {
          name: 'Scout Game',
          description: 'Scout Game',
          url: 'https://scoutgame.xyz',
          icons: ['https://scoutgame.xyz/images/farcaster/fc_icon.png']
        }
      }
    }
  );

  sharedConfig = createConfig({
    connectors,
    chains: wagmiChains,
    transports,
    ssr: true,
    storage: createStorage({ storage: cookieStorage })
  });

  return sharedConfig;
}
