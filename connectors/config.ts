import env from '@beam-australia/react-env';
import { coinbaseWallet, walletConnect, injected, mock } from '@wagmi/connectors';
import { getChainList } from 'connectors/chains';
import type { Address, Chain, Transport } from 'viem';
import { createPublicClient, custom, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { Connector } from 'wagmi';
import { createConfig } from 'wagmi';

import 'viem/window';
import { isTestEnv } from 'config/constants';

const allChains = getChainList({ enableTestnets: true });

// map our RPC list to the wagmi chain list
const viemChains = allChains.map((rpc) => rpc.viem) as [Chain, ...Chain[]];

const connectors = [
  injected({
    shimDisconnect: true
    // target: {
    //   name: 'Injected'
    // }
  }),
  coinbaseWallet({
    appName: 'CharmVerse.io'
  }),
  ...(env('WALLETCONNECT_PROJECTID') ? [walletConnect({ projectId: env('WALLETCONNECT_PROJECTID') })] : [])
];

export const wagmiConfig = createConfig({
  chains: viemChains,
  connectors,
  transports: viemChains.reduce<Record<string, Transport>>((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {})
});

const chains = wagmiConfig.chains;

export const getTestWagmiConfig = () => {
  if (!isTestEnv) {
    return wagmiConfig;
  }

  // use custom window.ethereum object in tests to be able to mock it
  // https://github.com/DePayFi/web3-mock#viem--wagmi
  // NOTE: we need window object first, to be able to use window.ethereum
  if (typeof window !== 'undefined') {
    // get the test wallet address set by the test runner or use a default one
    const storedAccount = window.localStorage.getItem('charm.v1.testWalletAddress') as Address;
    const account = storedAccount || '0x80c2AE072212ab96B7fa2fEE0efba986DC46C4e5';

    // use mocked window.ethereum when available or default to http provider
    const transport =
      typeof window.ethereum !== 'undefined' ? custom(window.ethereum) : http(mainnet.rpcUrls.default.http[0]);

    return createConfig({
      // autoConnect: !!storedAccount,
      chains: [mainnet],
      connectors: [
        mock({
          // walletClient: createWalletClient({
          //   chain: mainnet,
          //   transport,
          //   account
          // }),
          accounts: [account]
          // flags: {
          //   isAuthorized: true
          // }
        }),
        injected({
          shimDisconnect: true
        })
      ],
      transports: {
        [mainnet.id]: transport
      }
    });
  }
};
