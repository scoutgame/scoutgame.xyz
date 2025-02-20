'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { InviteModal } from '../components/builders/InviteModal/InviteModal';
import { NFTPurchaseDialog } from '../components/common/NFTPurchaseDialog/NFTPurchaseDialog';

import { useUser } from './UserProvider';

// Add here all the modal names you need
type ModalType = 'newBuilder' | 'nftPurchase';

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
    nftPurchase: { open: false, data: null }
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
