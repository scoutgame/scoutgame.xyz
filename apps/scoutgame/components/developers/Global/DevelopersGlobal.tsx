'use client';

import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

export function DevelopersGlobal() {
  const { user } = useUser();
  const { openModal } = useGlobalModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuilder = !!user?.builderStatus;
  const builderModal = searchParams.get('modal');

  useEffect(() => {
    if (!isBuilder && builderModal === 'newBuilder') {
      router.replace('/developers');
      openModal('newBuilder');
    }
    if (builderModal) {
      router.replace('/developers');
    }
  }, [isBuilder, builderModal]);

  return null;
}
