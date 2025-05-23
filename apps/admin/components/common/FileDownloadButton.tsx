'use client';

import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import type { ReactNode } from 'react';

import { useFileDownload } from 'hooks/useFileDownload';

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
  const { isDownloading, downloadFile } = useFileDownload(src, filename);
  return (
    <Button
      loading={isDownloading}
      onClick={async () => {
        await downloadFile();
        onComplete?.();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
