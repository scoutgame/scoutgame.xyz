'use client';

import { log } from '@charmverse/core/log';
import { getDeveloperInfo, type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

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
  const [developerPath, setDeveloperPath] = useState<string | null>(null);
  const router = useRouter();

  const { data: developer, isLoading } = useSWR(
    developerPath ? `developer-${developerPath}` : null,
    async () => {
      if (!developerPath) {
        return null;
      }

      const _developer = await getDeveloperInfo(developerPath);
      if (!_developer) {
        // If the developer doesn't exist, redirect to the user's profile
        router.push(`/u/${developerPath}`);
      }
      return _developer;
    },
    {
      onError: (error) => {
        log.error('Error fetching developer info', { error, path: developerPath });
        toast.error('Error fetching developer info');
      }
    }
  );

  const openModal = useCallback((path: string) => {
    setIsOpen(true);
    setDeveloperPath(path);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setDeveloperPath(null);
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
      {isOpen ? <DeveloperInfoModal developer={developer ?? null} onClose={closeModal} isLoading={isLoading} /> : null}
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
