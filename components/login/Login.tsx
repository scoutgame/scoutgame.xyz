import EmailIcon from '@mui/icons-material/Email';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import type { IdentityType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';

import { WalletSelector } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal';
import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import Button from 'components/common/Button';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SystemError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models/User';

import { CollectEmail } from './CollectEmail';
import { LoginErrorModal } from './LoginErrorModal';
import { WalletSign } from './WalletSign';

export type AnyIdLogin<I extends IdentityType = IdentityType> = {
  identityType: I;
  user: LoggedInUser;
  displayName: string;
};

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  open: () => void;
}

function LoginHandler(props: DialogProps) {
  const { onClose, isOpen, open } = props;
  const { loginFromWeb3Account } = useWeb3AuthSig();

  const [loginMethod, setLoginMethod] = useState<'email' | null>(null);

  const [showLoginError, setShowLoginError] = useState(false);

  const { showMessage } = useSnackbar();

  const sendingMagicLink = useRef(false);

  const { loginWithGoogle, requestMagicLinkViaFirebase } = useFirebaseAuth();
  const { verifiableWalletDetected } = useWeb3AuthSig();
  async function handleLogin(loggedInUser: AnyIdLogin) {
    showMessage(`Logged in with ${loggedInUser?.identityType}. Redirecting you now`, 'success');
    window.location.reload();
  }

  async function handleGoogleLogin() {
    try {
      const googleLoginResult = await loginWithGoogle();
      handleLogin(googleLoginResult);
    } catch (err) {
      handleLoginError(err);
    }
  }

  async function handleMagicLinkRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      // console.log('Handling magic link request');
      try {
        await requestMagicLinkViaFirebase({ email });
        onClose();
        setLoginMethod(null);
      } catch (err) {
        handleLoginError(err);
      } finally {
        sendingMagicLink.current = false;
      }
    }
  }

  async function handleWeb3Login(authSig: AuthSig) {
    try {
      const user = await loginFromWeb3Account(authSig);
      handleLogin({
        identityType: 'Wallet',
        displayName: authSig.address,
        user
      });
    } catch (err) {
      handleLoginError(err);
    }
  }

  function handleLoginError(err: any) {
    if ((err as SystemError)?.errorType === 'Disabled account') {
      setShowLoginError(true);
    }
  }

  function toggleEmailDialog(position: 'open' | 'close') {
    if (position === 'open') {
      setLoginMethod('email');
    } else {
      setLoginMethod(null);
    }
  }

  return (
    <>
      <Dialog onClose={loginMethod ? () => setLoginMethod(null) : onClose} open={isOpen}>
        {!loginMethod && (
          <List sx={{ pt: 0, maxWidth: '400px' }}>
            <DialogTitle textAlign='left'>Connect Wallet</DialogTitle>

            {/** Web 3 login methods */}
            <ListItem>
              <WalletSelector loginSuccess={handleLogin} onError={handleLoginError} />
            </ListItem>
            {verifiableWalletDetected && (
              <ListItem>
                <WalletSign buttonStyle={{ width: '100%' }} signSuccess={handleWeb3Login} enableAutosign />
              </ListItem>
            )}

            <DialogTitle sx={{ mt: -1 }} textAlign='left'>
              Connect Account
            </DialogTitle>

            {/* Google login method */}
            <ListItem>
              <ConnectorButton
                onClick={handleGoogleLogin}
                name='Connect with Google'
                iconUrl='Google_G.png'
                disabled={false}
                isActive={false}
                isLoading={false}
              />
            </ListItem>

            {/** Connect with email address */}
            <ListItem>
              <ConnectorButton
                onClick={() => toggleEmailDialog('open')}
                name='Connect with email'
                icon={<EmailIcon />}
                disabled={false}
                isActive={false}
                isLoading={false}
              />
            </ListItem>
          </List>
        )}
        {loginMethod === 'email' && (
          <CollectEmail
            loading={sendingMagicLink.current === true}
            title='Connect with email'
            description="Enter your email address and we'll email you a login link"
            handleSubmit={handleMagicLinkRequest}
          />
        )}
      </Dialog>
      <LoginErrorModal open={showLoginError} onClose={() => setShowLoginError(false)} />
    </>
  );
}

export function Login() {
  const loginDialog = usePopupState({ variant: 'popover', popupId: 'login-dialog' });
  const { resetSigning } = useWeb3AuthSig();

  const handleClickOpen = () => {
    loginDialog.open();
  };

  const handleClose = () => {
    loginDialog.close();
    resetSigning();
  };

  return (
    <div>
      <Button
        sx={{ width: '100%' }}
        onClick={handleClickOpen}
        data-test='universal-connect-button'
        size='large'
        primary
      >
        Connect
      </Button>
      <LoginHandler isOpen={loginDialog.isOpen} open={loginDialog.open} onClose={handleClose} />
    </div>
  );
}
