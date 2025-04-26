'use client';

import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { NFTListingDialog } from 'components/common/NFTListing/NFTListingDialog';
import { NFTListingPurchaseDialog } from 'components/common/NFTListingPurchase/NFTListingPurchaseDialog';
import { NFTPurchaseDialog } from 'components/common/NFTPurchaseDialog/NFTPurchaseDialog';
import { InviteModal } from 'components/developers/InviteModal/InviteModal';
import { DraftRegistrationDialog } from 'components/matchup/components/DraftRegistrationDialog';

import { DeveloperInfoModal } from './DeveloperInfoModal/DeveloperInfoModal';
import { DraftDeveloperInfoModal } from './DraftDeveloperInfoModal/DraftDeveloperInfoModal';
import { SignInModalMessage } from './ScoutButton/SignInModalMessage';

// Add here all the modal names you need
type ModalType =
  | 'newBuilder'
  | 'nftPurchase'
  | 'nftListing'
  | 'nftListingPurchase'
  | 'developerInfo'
  | 'draftDeveloper'
  | 'draftRegistration'
  | 'signIn';

type ModalContextType = {
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const openModal = useCallback((type: ModalType, data?: any) => {
    setModalType(type);
    setModalData(data);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setModalData(null);
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      openModal,
      closeModal
    }),
    [openModal, closeModal]
  );

  function isTypeOpen(type: ModalType) {
    return modalType === type && isOpen;
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
      <InviteModal open={isTypeOpen('newBuilder')} onClose={closeModal} signedIn={!!user} />
      <NFTPurchaseDialog builder={modalData} open={isTypeOpen('nftPurchase')} onClose={closeModal} />
      <NFTListingDialog builder={modalData} open={isTypeOpen('nftListing')} onClose={closeModal} />
      <NFTListingPurchaseDialog
        listing={modalData?.listing}
        builder={modalData?.builder}
        open={isTypeOpen('nftListingPurchase')}
        onClose={closeModal}
      />
      <DeveloperInfoModal open={isTypeOpen('developerInfo')} data={modalData} onClose={closeModal} />
      <DraftDeveloperInfoModal open={isTypeOpen('draftDeveloper')} data={modalData} onClose={closeModal} />
      <DraftRegistrationDialog open={isTypeOpen('draftRegistration')} onClose={closeModal} />
      <SignInModalMessage open={isTypeOpen('signIn')} onClose={closeModal} path={modalData?.path} />
    </ModalContext.Provider>
  );
}

/**
 * Hook to open and close global modals
 */
export function useGlobalModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
}
