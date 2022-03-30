import { ReactNode, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { User } from '@prisma/client';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';
import { isSpaceDomain } from 'lib/spaces';
import charmClient from 'charmClient';
import type { UrlObject } from 'url';

// TODO: Discord login for /invite route

// Pages shared to the public that don't require user login
const publicPages = ['/', 'invite', 'share'];

export default function RouteGuard ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const [authorized, setAuthorized] = useState(true);
  const { triedEager } = useContext(Web3Connection);
  const { account } = useWeb3React();
  const [user, setUser, isUserLoaded] = useUser();
  const [spaces, _, isSpacesLoaded] = useSpaces();
  const isUserLoading = !!(account && !isUserLoaded);
  const isWalletLoading = (!triedEager && !account);
  const isRouterLoading = !router.isReady;
  const isLoading = isUserLoading || isWalletLoading || isRouterLoading || !isSpacesLoaded;

  async function onOnlyWallet (_account: string) {
    try {
      const _user = await charmClient.login(_account);
      return { authorized: false, user: _user };
    }
    catch (error) {
      const _user = await charmClient.createUser({ address: _account });
      return { authorized: false, user: _user };
    }
  }

  async function onNoWalletOrUser (getUser: boolean) {
    // After the discord import roles oauth flow we will be redirected to where we initiated the import /settings/roles or maybe some other url
    // But since the user doesn't have a wallet connected, there is neither any user nor any address, so we will be redirected to the home page (/)
    // So attempt to log the user back in using their session cookie, if we detect that they came from a discord oauth flow
    // Also if the user is viewing individual bounty try to log them in as it removes the react state
    if (getUser) {
      try {
        const loggedInUser = await charmClient.getUser();
        return {
          authorized: true,
          user: loggedInUser as User
        };
      }
      catch (__) {
        // User might not be present in the session, but it shouldn't be the case if we are importing roles for discord
        // As that means someone logged in and tried to import roles but dont have the session cookie store?
        // Send them to home page to connect via their wallet or discord
      }
    }

    return {
      authorized: false,
      redirect: {
        pathname: '/',
        query: { returnUrl: router.asPath }
      }
    };
  }

  useEffect(() => {
    // wait to listen to events until data is loaded
    if (isLoading) {
      return;
    }

    function authCheckAndRedirect (path: string) {
      authCheck(path)
        .then(result => {
          setAuthorized(result.authorized);
          if (result.user) {
            setUser(result.user);
          }
          if (result.redirect) {
            router.push(result.redirect);
          }
        });
    }
    authCheckAndRedirect(router.asPath);

    // on route change start - hide page content by setting authorized to false
    const hideContent = () => {
      setAuthorized(false);
    };
    router.events.on('routeChangeStart', hideContent);

    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheckAndRedirect);

    // unsubscribe from events in useEffect return function
    // eslint-disable-next-line consistent-return
    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheckAndRedirect);
    };
  }, [isLoading, account, user, spaces]);

  // authCheck runs before each page load and redirects to login if user is not logged in
  async function authCheck (url: string): Promise<{ authorized: boolean, redirect?: UrlObject, user?: User }> {
    const path = url.split('?')[0];
    const firstPathSegment = path.split('/').filter(pathElem => {
      // Only get segments that evaluate to some value
      return pathElem;
    })[0] ?? '/';
    const isImportingRolesFromDiscord = router.query.guild_id && router.query.discord === '1' && router.query.type === 'server';
    const isViewingBountyDetails = router.pathname === '/[domain]/bounties/[bountyId]';

    const spaceDomain = path.split('/')[1];
    // condition: public page
    if (publicPages.some(basePath => firstPathSegment === basePath)) {
      // Connected wallet in / route
      if (account && !user) {
        return onOnlyWallet(account);
      }
      return { authorized: true };
    }
    // condition: wallet not connected and user is not connected with discord
    else if (!account && !user) {
      return onNoWalletOrUser(isImportingRolesFromDiscord || isViewingBountyDetails);
    }
    // condition: user not loaded
    else if (!user && account) {
      console.log('[RouteGuard]: user not loaded');
      return onOnlyWallet(account);
    }
    // condition: user switches to a new/unknown address
    // Users created via discord will have user.addresses === 0
    else if (user && account && (user.addresses.length !== 0 && !user.addresses.includes(account))) {
      console.log('[RouteGuard]: unknown address');
      let _user = await charmClient.login(account).catch(err => null);
      if (!_user) {
        _user = await charmClient.createUser({ address: account });
      }
      return { authorized: false, user: _user };
    }
    // condition: trying to access a space without access
    else if (!isViewingBountyDetails && !isImportingRolesFromDiscord && isSpaceDomain(spaceDomain) && !spaces.some(s => s.domain === spaceDomain)) {
      console.log('[RouteGuard]: send to join workspace page');
      return {
        authorized: false,
        redirect: {
          pathname: '/join',
          query: { domain: spaceDomain, returnUrl: router.asPath }
        }
      };
    }
    else {
      return { authorized: true };
    }
  }

  if (isLoading) {
    return null;
  }
  return (
    <span>
      {authorized
        ? children
        : null}
    </span>
  );
}
