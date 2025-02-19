'use client';

import { log } from '@charmverse/core/log';
import { getDeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useGlobalModal } from '../providers/ModalProvider';

export function useDeveloperInfoModal() {
  const { openModal } = useGlobalModal();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const openDeveloperInfoModal = async (path: string) => {
    try {
      setIsLoading(true);
      const developer = await getDeveloperInfo(path);

      if (!developer) {
        return router.push(`/u/${path}`);
      }

      openModal('developerInfo', developer);
    } catch (error) {
      log.error('Error opening developer info modal', { error, path });
      toast.error('Error opening developer info modal');
    } finally {
      setIsLoading(false);
    }
  };

  return { openDeveloperInfoModal, isLoading };
}
