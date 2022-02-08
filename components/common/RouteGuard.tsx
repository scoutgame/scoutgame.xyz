import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';

const publicPaths = ['/login'];

export default function RouteGuard ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const isLoading = !router.isReady;
  const [authorized, setAuthorized] = useState(false);
  const { account, error } = useWeb3React();
  console.log('account', account, error);
  useEffect(() => {
    // wait to listen to events until user is loaded
    if (isLoading) {
      return;
    }
    // on initial load - run auth check
    authCheck(router.asPath);

    // on route change start - hide page content by setting authorized to false
    const hideContent = () => setAuthorized(false);
    router.events.on('routeChangeStart', hideContent);

    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheck);

    // unsubscribe from events in useEffect return function
    // eslint-disable-next-line consistent-return
    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheck);
    };
  }, [isLoading]);

  function authCheck (url: string) {
    // redirect to login page if accessing a private page and not logged in
    const path = url.split('?')[0];
    if (!account && !publicPaths.some(basePath => path.startsWith(basePath))) {
      setAuthorized(false);
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
    else {
      setAuthorized(true);
    }
  }

  if (isLoading) {
    return null;
  }
  return <span>{authorized ? children : null}</span>;
}
