'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

const toastOptions = {
  duration: 40000 // make it extra long so users can see it
};

export function VerifyEmailPage({ result }: { result: 'verified' | 'failed' | 'already_verified' }) {
  const router = useRouter();

  useEffect(() => {
    if (result === 'verified') {
      router.push('/');
      toast.success('Email verified!', toastOptions);
    } else if (result === 'failed') {
      toast.error('Failed to verify email', toastOptions);
    } else if (result === 'already_verified') {
      toast.info('Email already verified', toastOptions);
    }
  }, [router, result]);
  return <div></div>;
}
