import { isDraftSeason } from '@packages/dates/utils';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Get next link after login api returns a success
 *
 * Get params used in login page
 *
 * Wrap this function in Suspense
 */
export function useLoginSuccessHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
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

    const draftSeason = isDraftSeason();

    // If we are in draft season and the user is on the airdrop page, we want to keep them on the airdrop page
    if (draftSeason && pathname === '/airdrop') {
      return '/airdrop';
    }

    return redirectUrl || (draftSeason ? '/draft' : '/scout');
  }

  return {
    params: { type, redirectUrl, referralCode, inviteCode },
    getNextPageLink
  };
}
