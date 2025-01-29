'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';

export function BuildersGlobal() {
  const { user } = useUser();
  const { openModal } = useGlobalModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuilder = !!user?.builderStatus;
  const builderModal = searchParams.get('modal');

  useEffect(() => {
    if (!isBuilder && builderModal === 'newBuilder') {
      router.replace('/builders');
      openModal('newBuilder');
    }
    if (builderModal) {
      router.replace('/builders');
    }
  }, [isBuilder, builderModal]);

  return null;
}
