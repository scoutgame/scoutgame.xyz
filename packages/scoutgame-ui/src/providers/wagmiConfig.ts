'use client';

import env from '@beam-australia/react-env';
import farcasterConnector from '@farcaster/frame-wagmi-connector';
import { getAlchemyBaseUrl } from '@packages/blockchain/provider/alchemy/client';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, rainbowWallet, walletConnectWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
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

export function getConfig(options?: { projectId?: string }) {
  const projectId = options?.projectId || env('WALLETCONNECT_PROJECTID') || '';

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
      {
        groupName: 'Recommended',
        wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet]
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
      projectId
    }
  );

  const config = createConfig({
    connectors,
    chains: wagmiChains,
    transports,
    ssr: true,
    storage: createStorage({ storage: cookieStorage })
  });

  return config;
}
