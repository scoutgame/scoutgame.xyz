'use client';

import { log } from '@charmverse/core/log';
import { getDeveloperInfo, type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DeveloperInfoModal } from '../components/common/DeveloperInfoModal/DeveloperInfoModal';

type DeveloperInfoModalContextType = {
  openModal: (path: string) => void;
  closeModal: () => void;
  isLoading: boolean;
  isOpen: boolean;
};

const DeveloperInfoModalContext = createContext<DeveloperInfoModalContextType | null>(null);

export function DeveloperInfoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const router = useRouter();

  const openModal = useCallback((path: string) => {
    setIsLoading(true);
    setIsOpen(true);
    getDeveloperInfo(path)
      .then((_developer) => {
        if (_developer) {
          setDeveloper(_developer);
        } else {
          router.push(`/u/${path}`);
        }
      })
      .catch((error) => {
        log.error('Error fetching developer info', { error, path });
        toast.error('Error fetching developer info');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setDeveloper(null);
  }, []);

  const value = useMemo(
    () => ({
      openModal,
      closeModal,
      isLoading,
      isOpen
    }),
    [openModal, closeModal, isLoading, isOpen]
  );

  return (
    <DeveloperInfoModalContext.Provider value={value}>
      {children}
      {isOpen ? <DeveloperInfoModal developer={developer} onClose={closeModal} isLoading={isLoading} /> : null}
    </DeveloperInfoModalContext.Provider>
  );
}

/**
 * Hook to open and close global modals
 */
export function useDeveloperInfoModal() {
  const context = useContext(DeveloperInfoModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
}
