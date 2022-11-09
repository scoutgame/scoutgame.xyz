import { verifyMessage } from '@ethersproject/wallet';
import { useWeb3React } from '@web3-react/core';
import type { Signer } from 'ethers';
import { getAddress, toUtf8Bytes } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthSig, AuthSigWithRawAddress } from 'lib/blockchain/interfaces';
import log from 'lib/log';
import { ExternalServiceError, MissingWeb3AccountError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { Web3Connection } from '../components/_app/Web3ConnectionManager';

import { PREFIX, useLocalStorage } from './useLocalStorage';

type IContext = {
  // Web3 account belonging to the current logged in user
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
  library: any;
  chainId: any;
  sign: () => Promise<AuthSigWithRawAddress>;
  triedEager: boolean;
  getStoredSignature: () => AuthSigWithRawAddress | null;
  disconnectWallet: () => void;
  // Used by useUser to pass the user to the Web3 context
  setLoggedInUser: (user: LoggedInUser | null) => void;
  // Which tool is providing the web3 connection ie. Metamask∂, WalletConnect, etc.
  connector: any;
  // A wallet is currently connected and can be used to generate signatures. This is different from a user being connected
  verifiableWalletDetected: boolean;
  // Trigger workflow to connect a new wallet. In future, this can be used to support a situation where a browser has multiple wallets installed
  connectWallet: () => void;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  sign: () => Promise.resolve({} as AuthSigWithRawAddress),
  triedEager: false,
  getStoredSignature: () => null,
  disconnectWallet: () => null,
  library: null,
  chainId: null,
  setLoggedInUser: (user: LoggedInUser | null) => null,
  connector: null,
  verifiableWalletDetected: false,
  connectWallet: () => null
});

// a wrapper around account and library from web3react
export function Web3AccountProvider ({ children }: { children: ReactNode }) {

  const { account, library, chainId, connector } = useWeb3React();

  const verifiableWalletDetected = !!account;

  const { triedEager, openWalletSelectorModal } = useContext(Web3Connection);

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const [, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [, setLitProvider] = useLocalStorage<string | null>('lit-web3-provider', null, true);
  const [user, setLoggedInUser] = useState<LoggedInUser | null>(null);

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);

  function getStoredSignature (): AuthSigWithRawAddress | null {

    if (!account) {
      return null;
    }

    const stored = window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${account}`);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthSig;

        const rawAddress = (storedAccount ?? account as string);

        return {
          ...parsed,
          rawAddress
        };

      }
      catch (e) {
        log.error('Error parsing stored signature', e);
        return null;
      }
    }
    else {
      return null;
    }
  }

  const setCurrentUser = useCallback((updatedUser: LoggedInUser | null) => {
    setLoggedInUser(updatedUser);
  }, []);

  function setSignature (signature: AuthSig | null, writeToLocalStorage?: boolean) {

    if (writeToLocalStorage) {
      window.localStorage.setItem(`${PREFIX}.wallet-auth-sig-${account}`, JSON.stringify(signature));
    }

    // Ensures Lit signature is always in sync
    setLitAuthSignature(signature);
    setLitProvider('metamask');
    setWalletAuthSignature(signature);

  }

  // Only expose account if current user and account match up
  useEffect(() => {
    if (account && user?.wallets.some(w => w.address === account)) {
      setStoredAccount(account);

      const storedWalletSignature = getStoredSignature();
      setSignature(storedWalletSignature);

    }
    else {
      setSignature(null);
      setStoredAccount(null);
    }
  }, [account, user]);

  async function sign (): Promise<AuthSigWithRawAddress> {

    if (!account) {
      throw new MissingWeb3AccountError();
    }

    const signer = library.getSigner(account) as Signer;

    if (!signer) {
      throw new ExternalServiceError('Missing signer');
    }

    const signerChainId = await signer.getChainId();

    const preparedMessage = {
      domain: window.location.host,
      address: getAddress(account), // convert to EIP-55 format or else SIWE complains
      uri: globalThis.location.origin,
      version: '1',
      chainId: signerChainId
    };

    const message = new SiweMessage(preparedMessage);

    const body = message.prepareMessage();

    const messageBytes = toUtf8Bytes(body);

    const newSignature = await signer.signMessage(messageBytes);
    const signatureAddress = verifyMessage(body, newSignature).toLowerCase();

    if (!lowerCaseEqual(signatureAddress, account)) {
      throw new Error('Signature address does not match account');
    }

    const generated: AuthSig = {
      sig: newSignature,
      derivedVia: 'charmverse.sign',
      signedMessage: body,
      address: signatureAddress
    };

    setSignature(generated, true);

    return { ...generated, rawAddress: account };
  }

  function disconnectWallet () {
    if (account) {
      window.localStorage.removeItem(`${PREFIX}.wallet-auth-sig-${account}`);
      setWalletAuthSignature(null);
    }
  }

  function connectWallet () {

    openWalletSelectorModal();
  }

  // console.log('Detected account', account, '\r\nWallet detected', verifiableWalletDetected, '\r\nExposed account', storedAccount, '\r\nConnector:', connector);

  const value = useMemo<IContext>(() => ({
    account: storedAccount,
    walletAuthSignature,
    triedEager,
    sign,
    getStoredSignature,
    disconnectWallet,
    library,
    chainId,
    setLoggedInUser: setCurrentUser,
    connector,
    verifiableWalletDetected,
    connectWallet
  }), [account, walletAuthSignature, triedEager, storedAccount, connector]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );

}

export const useWeb3AuthSig = () => useContext(Web3Context);
