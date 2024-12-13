'use client';

import { LoadingButton } from '@mui/lab';
import type { ButtonProps } from '@mui/material';
import { useGETtrigger } from '@packages/scoutgame-ui/hooks/helpers';
import type { ReactNode } from 'react';

export function FileDownloadButton({
  children,
  src,
  filename,
  onComplete,
  ...props
}: {
  children: ReactNode;
  src: string;
  filename: string;
  onComplete?: () => void;
} & ButtonProps) {
  const { trigger, isMutating } = useGETtrigger<undefined, string>(src, { timeout: 60000 });
  async function onClick() {
    const response = await trigger();
    const url = window.URL.createObjectURL(new Blob([response], { type: 'text/tsv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    onComplete?.();
  }
  return (
    <LoadingButton loading={isMutating} onClick={onClick} {...props}>
      {children}
    </LoadingButton>
  );
}
