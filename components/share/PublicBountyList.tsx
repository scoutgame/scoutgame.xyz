import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { useContext, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Bounty } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import BountyList from 'components/bounties/BountyList';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateForm from 'components/common/TokenGateForm';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';

import Login from 'components/login/LoginPageContent';

export default function PublicBountyList () {
  const router = useRouter();

  const [contributors] = useContributors();
  const [space] = useCurrentSpace();
  const { account } = useWeb3React();
  const [user, setUser] = useUser();
  const { showMessage } = useSnackbar();

  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);

  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });

  const isSpaceMember = user && contributors.some(c => c.id === user.id);

  useEffect(() => {

    if (account && !user) {
      loginUser();
    }

  }, [account]);

  function bountySelected (bounty: Bounty) {

    if (isSpaceMember) {
      // We pass the bounty as the useState setter will not have set the new bounty state before calling redirect to space
      redirectToSpace(bounty);
    }
    else {
      setSelectedBounty(bounty);
      loginViaTokenGateModal.open();
    }

  }

  function redirectToSpace (bounty: Bounty | null = selectedBounty) {

    const redirectUrl = bounty ? `/${space?.domain}/bounties/${bounty.id}` : `/${space?.domain}/bounties`;

    router.push(redirectUrl);

  }

  function loginUser () {
    setLoggingIn(true);
    charmClient.login(account as string)
      .then(loggedInProfile => {
        setUser(loggedInProfile);
        setLoggingIn(false);
      })
      .catch(() => {
        charmClient.createUser({
          address: account as string
        }).then(loggedInProfile => {
          setUser(loggedInProfile);
          setLoggingIn(false);
        });
      });
  }

  if (!space) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (space.publicBountyBoard ? (
    <>
      <BountyList publicMode bountyCardClicked={bountySelected} />
      <Modal size='large' open={loginViaTokenGateModal.isOpen} onClose={loginViaTokenGateModal.close}>
        {
          !account && (
            <>
              <Typography variant='h2' display='block' textAlign='center'>Join the {space?.name} workspace to apply</Typography>

              <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>

                <PrimaryButton onClick={openWalletSelectorModal} loading={loggingIn}>
                  Connect wallet
                </PrimaryButton>
              </Box>
            </>
          )
        }

        {
          account && user && (
            <TokenGateForm
              onSubmit={() => {
                loginViaTokenGateModal.close();
                showMessage(`You've joined the ${space.name} workspace.`, 'success');

                // Wait for 2 seconds before redirecting
                setTimeout(() => {
                  redirectToSpace();
                }, 2000);

              }}
              spaceDomainToAccess={space.domain}
            />
          )
        }

      </Modal>
    </>
  ) : <ErrorPage message={"Sorry, this workspace's bounties are reserved to its members."} />);
}
