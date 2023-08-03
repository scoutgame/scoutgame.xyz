import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { googleWebClientConfig } from 'config/constants';
import { useUser } from 'hooks/useUser';
import { getAppUrl } from 'lib/utilities/browser';
import { InvalidInputError } from 'lib/utilities/errors';

import { useLocalStorage } from './useLocalStorage';
import { useSnackbar } from './useSnackbar';

export function useFirebaseAuth() {
  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());
  const { setUser } = useUser();
  const [emailForSignIn, setEmailForSignIn] = useLocalStorage('emailForSignIn', '');
  const router = useRouter();
  const { showMessage } = useSnackbar();

  useEffect(() => {
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }, []);

  async function requestMagicLinkViaFirebase({
    email,
    connectToExistingAccount,
    redirectUrl
  }: {
    redirectUrl?: string;
    email: string;
    connectToExistingAccount?: boolean;
  }) {
    // console.log('IN', { email });
    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    const url = new URL(`${getAppUrl()}authenticate`);

    if (connectToExistingAccount) {
      url.searchParams.set('connectToExistingAccount', 'true');
    }

    if (redirectUrl) {
      url.searchParams.set('redirectUrl', redirectUrl);
    }

    const actionCodeSettings = {
      url: url.toString(),
      handleCodeInApp: true
    };

    // Always set this, so a previous email is overwritten
    setEmailForSignIn(email);

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
  }

  /**
   * Validate the data from a magic link, and login the user
   */
  async function validateMagicLink() {
    const email = emailForSignIn;

    if (!email) {
      throw new InvalidInputError(`Could not login`);
    }

    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);

        const token = await result.user.getIdToken();

        const loggedInUser = await (router.query.connectToExistingAccount === 'true'
          ? charmClient.google.connectEmailAccount({
              accessToken: token
            })
          : charmClient.google.authenticateMagicLink({
              accessToken: token
            }));

        setUser(loggedInUser);
        setEmailForSignIn('');
        // We want to bubble up the error, so we can show a relevant message, but always clear the email
      } catch (err) {
        setEmailForSignIn('');
        throw err;
      }
    } else {
      setEmailForSignIn('');
      throw new InvalidInputError(`Could not login`);
    }
  }

  function disconnectVerifiedEmailAccount(email: string) {
    charmClient.google.disconnectEmailAccount({ email }).then((loggedInUser) => {
      setUser(loggedInUser);
    });
  }

  return {
    requestMagicLinkViaFirebase,
    validateMagicLink,
    disconnectVerifiedEmailAccount,
    emailForSignIn,
    setEmailForSignIn
  };
}
