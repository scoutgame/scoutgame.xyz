'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { InviteModal } from '../components/builders/InviteModal/InviteModal';

import { useUser } from './UserProvider';

// Add here all the modal names you need
type ModalType = 'newBuilder';

type ModalState = {
  [key in ModalType]: boolean;
};

type ModalContextType = {
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  isOpen: (type: ModalType) => boolean;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({ newBuilder: false });
  const { user } = useUser();

  const openModal = useCallback((type: ModalType) => {
    setModalState((prevState) => ({ ...prevState, [type]: true }));
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModalState((prevState) => ({ ...prevState, [type]: false }));
  }, []);

  const isOpen = useCallback(
    (type: ModalType) => {
      return type in modalState ? modalState[type] : false;
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
      <InviteModal open={modalState?.newBuilder} onClose={() => closeModal('newBuilder')} signedIn={!!user} />
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
