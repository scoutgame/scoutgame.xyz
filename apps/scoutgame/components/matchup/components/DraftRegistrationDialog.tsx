'use client';

import { log } from '@charmverse/core/log';
import { MATCHUP_REGISTRATION_FEE } from '@packages/matchup/config';
import { registerForMatchupAction } from '@packages/matchup/registerForMatchupAction';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { usePurchase } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

import type { ConnectedWalletDialogProps } from 'components/common/ConnectedWalletDialog';
import { ConnectedWalletDialog } from 'components/common/ConnectedWalletDialog';
import { useGlobalModal } from 'components/common/ModalProvider';

// import type { NFTPurchaseProps } from './components/NFTPurchaseForm';
// import { NFTPurchaseForm } from './components/NFTPurchaseForm';

// This component opens the wallet connect modal if the user is not connected yet
function DraftRegistrationDialogComponent() {
  const { refreshUser, user } = useUser();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const { closeModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);
  const hasEnoughPoints = user?.currentBalance && user.currentBalance >= MATCHUP_REGISTRATION_FEE;

  const { execute, isExecuting } = useAction(registerForMatchupAction, {
    async onSuccess() {
      toast.success('Successfully registered for matchup');
      revalidatePathAction();
      refreshUser();
      closeModal();
    },
    onError(err) {
      toast.error('Error registering for matchup');
      log.error('Error registering for matchup', { error: err });
      closeModal();
    }
  });

  return <div>hello world</div>;
}

export function DraftRegistrationDialog(props: ConnectedWalletDialogProps) {
  return (
    <ConnectedWalletDialog open={props.open} onClose={props.onClose}>
      <DraftRegistrationDialogComponent />
    </ConnectedWalletDialog>
  );
}
