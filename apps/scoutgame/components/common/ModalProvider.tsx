'use client';

import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { NFTListingDialog } from 'components/common/NFTListing/NFTListingDialog';
import { NFTListingPurchaseDialog } from 'components/common/NFTListingPurchase/NFTListingPurchaseDialog';
import { NFTPurchaseDialog } from 'components/common/NFTPurchaseDialog/NFTPurchaseDialog';
import { InviteModal } from 'components/developers/InviteModal/InviteModal';

import { DeveloperInfoModal } from './DeveloperInfoModal/DeveloperInfoModal';
import { DraftDeveloperInfoModal } from './DraftDeveloperInfoModal/DraftDeveloperInfoModal';

// Add here all the modal names you need
type ModalType =
  | 'newBuilder'
  | 'nftPurchase'
  | 'nftListing'
  | 'nftListingPurchase'
  | 'developerInfo'
  | 'draftDeveloper';

type ModalState = {
  [key in ModalType]: { open: boolean; data?: any };
};

type ModalContextType = {
  openModal: (type: ModalType, data?: any) => void;
  closeModal: (type: ModalType) => void;
  isOpen: (type: ModalType) => boolean;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    newBuilder: { open: false, data: null },
    nftPurchase: { open: false, data: null },
    nftListing: { open: false, data: null },
    nftListingPurchase: { open: false, data: null },
    developerInfo: { open: false, data: null },
    draftDeveloper: { open: false, data: null }
  });
  const { user } = useUser();

  const openModal = useCallback((type: ModalType, data?: any) => {
    setModalState((prevState) => ({ ...prevState, [type]: { open: true, data } }));
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModalState((prevState) => ({ ...prevState, [type]: { open: false, data: null } }));
  }, []);

  const isOpen = useCallback(
    (type: ModalType) => {
      return type in modalState ? modalState[type]?.open : false;
    },
    [modalState]
  );

  const value = useMemo(
    () => ({
      openModal,
      closeModal,
      isOpen
    }),
    [openModal, closeModal, isOpen]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <InviteModal open={modalState?.newBuilder?.open} onClose={() => closeModal('newBuilder')} signedIn={!!user} />
      <NFTPurchaseDialog
        builder={modalState?.nftPurchase?.data}
        open={modalState?.nftPurchase?.open}
        onClose={() => closeModal('nftPurchase')}
      />
      <NFTListingDialog
        builder={modalState?.nftListing?.data}
        open={modalState?.nftListing?.open}
        onClose={() => closeModal('nftListing')}
      />
      <NFTListingPurchaseDialog
        listing={modalState?.nftListingPurchase?.data?.listing}
        builder={modalState?.nftListingPurchase?.data?.builder}
        open={modalState?.nftListingPurchase?.open}
        onClose={() => closeModal('nftListingPurchase')}
      />
      <DeveloperInfoModal
        open={modalState?.developerInfo?.open}
        data={modalState?.developerInfo?.data}
        onClose={() => closeModal('developerInfo')}
      />
      <DraftDeveloperInfoModal
        open={modalState?.draftDeveloper?.open}
        data={modalState?.draftDeveloper?.data}
        onClose={() => closeModal('draftDeveloper')}
      />
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
