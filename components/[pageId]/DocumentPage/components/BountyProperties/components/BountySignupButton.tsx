import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import TokenGateForm from 'components/common/TokenGateForm';
import { WalletSign } from 'components/login/WalletSign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { PageMeta } from 'lib/pages';
import { lowerCaseEqual } from 'lib/utilities/strings';

interface Props {
  bountyPage: PageMeta;
}

export function BountySignupButton({ bountyPage }: Props) {
  const { account, walletAuthSignature, loginFromWeb3Account } = useWeb3AuthSig();
  const { user, setUser, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { members } = useMembers();
  const space = useCurrentSpace();
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });
  const [loggingIn, setLoggingIn] = useState(false);

  const isSpaceMember = Boolean(user && members.some((c) => c.id === user.id));
  const showSignup = isUserLoaded && (!user || !isSpaceMember);
  const showSpaceRedirect = isUserLoaded && isSpaceMember;

  function loginUser() {
    if (
      !loggingIn &&
      account &&
      walletAuthSignature &&
      lowerCaseEqual(walletAuthSignature?.address as string, account as string)
    ) {
      setLoggingIn(true);
      charmClient
        .login({ address: account as string, walletSignature: walletAuthSignature })
        .then((loggedInProfile) => {
          setUser(loggedInProfile);
          setLoggingIn(false);
        });
    }
  }

  useEffect(() => {
    if (account && !user) {
      loginUser();
    }
  }, [account]);

  return (
    <>
      <Box display='flex' justifyContent='center' sx={{ my: 2 }} data-test='public-bounty-space-action'>
        {showSignup && (
          <Button color='primary' onClick={loginViaTokenGateModal.open}>
            Join this space to apply
          </Button>
        )}

        {showSpaceRedirect && (
          <Button
            color='primary'
            onClick={() => {
              router.push(`/${space?.domain}/${bountyPage.path}`);
            }}
          >
            View this bounty inside the space
          </Button>
        )}
      </Box>

      <Modal
        size='large'
        open={loginViaTokenGateModal.isOpen}
        onClose={loginViaTokenGateModal.close}
        title={`Join the ${space?.name} space to apply`}
      >
        {!account ? (
          <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>
            <WalletSign signSuccess={loginFromWeb3Account} />
          </Box>
        ) : (
          <TokenGateForm
            onSuccess={() => {
              window.location.href = `${window.location.origin}/${space?.domain}/${bountyPage.path}`;
            }}
            spaceDomain={space?.domain ?? ''}
            joinType='public_bounty_token_gate'
          />
        )}
      </Modal>
    </>
  );
}
