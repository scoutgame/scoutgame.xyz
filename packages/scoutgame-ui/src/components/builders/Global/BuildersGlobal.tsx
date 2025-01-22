'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useGlobalModal } from '../../../providers/ModalProviders';
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
      openModal('newBuilder');
      router.replace('/builders');
    }
  }, [isBuilder, builderModal]);

  return null;
}
