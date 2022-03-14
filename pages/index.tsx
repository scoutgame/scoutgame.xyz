import { useContext, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import getBaseLayout from 'components/common/base-layout/getLayout';
import LoginPageContent from 'components/login/LoginPageContent';
import { usePageTitle } from 'hooks/usePageTitle';
import Footer from 'components/login/Footer';
import { useSpaces } from 'hooks/useSpaces';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useUser } from 'hooks/useUser';

export default function LoginPage () {

  const { account } = useWeb3React();
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const [user, setUser, isUserLoaded] = useUser();
  const [spaces, setSpaces, isSpacesLoaded] = useSpaces();
  const [isLoaded, setIsLoaded] = useState(false); // capture isLoaded state to prevent render on route change

  const isDataLoaded = triedEager && isSpacesLoaded && isUserLoaded;

  useEffect(() => {
    setTitleState('Welcome');
  }, []);

  useEffect(() => {

    // redirect user once wallet is connected
    if (isDataLoaded) {
      // redirect once account exists (user has connected wallet)
      if (account) {
        if (typeof router.query.returnUrl === 'string') {
          router.push(router.query.returnUrl);
        }
        else if (spaces.length > 0) {
          router.push(`/${spaces[0]!.domain}`);
        }
        else {
          router.push('/signup');
        }
      }
      else {
        setIsLoaded(true);
      }
    }
  }, [account, isDataLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <LoginPageContent account={account} />
      <Footer />
    </>
  );
}

LoginPage.getLayout = getBaseLayout;
