import { useSearchParams } from 'next/navigation';

/**
 * Get next link after login api returns a success
 *
 * Get params used in login page
 *
 * Wrap this function in Suspense
 */
export function useLoginSuccessHandler() {
  const searchParams = useSearchParams();
  const redirectUrlEncoded = searchParams.get('redirectUrl');
  const type = searchParams.get('type');
  const referralCode = searchParams.get('ref');
  const inviteCode = searchParams.get('invite-code');
  const redirectUrl = redirectUrlEncoded ? decodeURIComponent(redirectUrlEncoded) : null;

  function getNextPageLink(user?: { onboarded?: boolean }) {
    const searchparams = new URLSearchParams();
    if (type) {
      searchparams.set('type', type);
    }
    if (redirectUrl) {
      searchparams.set('redirectUrl', encodeURIComponent(redirectUrl));
    }

    if (user && !user.onboarded) {
      return `/welcome?${searchparams.toString()}`;
    }

    if (inviteCode && user?.onboarded) {
      searchparams.set('step', '2');
      return `/welcome?${searchparams.toString()}`;
    }

    return redirectUrl || '/scout';
  }

  return {
    params: { type, redirectUrl, referralCode, inviteCode },
    getNextPageLink
  };
}
