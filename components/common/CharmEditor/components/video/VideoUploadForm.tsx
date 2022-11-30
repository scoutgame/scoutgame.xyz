// upload form src by mux: https://github.com/vercel/next.js/blob/canary/examples/with-mux-video/components/upload-form.js

import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import * as UpChunk from '@mux/upchunk';
import { useEffect, useState } from 'react';
import useSwr from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import log from 'lib/log';

type Props = {
  onComplete: (muxId: string) => void;
  pageId: string;
};

export function VideoUploadForm(props: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // poll endpoint until video is ready
  const { data: upload, error } = useSwr(
    () => (isPreparing ? `/api/mux/upload/${uploadId}` : null),
    () => {
      return charmClient.mux.getUpload({ id: uploadId!, pageId: props.pageId });
    },
    {
      refreshInterval: 5000
    }
  );

  useEffect(() => {
    if (upload && upload.asset_id) {
      props.onComplete(upload.asset_id);
    }
  }, [upload]);

  if (error) return <Alert severity='error'>Error fetching api</Alert>;

  async function createUpload() {
    try {
      const result = await charmClient.mux.createUpload({ pageId: props.pageId });
      setUploadId(result.id);
      return result.url;
    } catch (e) {
      log.error('Error in createUpload', e);
      setErrorMessage('Error creating upload');
      return '';
    }
  }

  function startUpload(file: File) {
    setIsUploading(true);
    const req = UpChunk.createUpload({
      endpoint: createUpload,
      file
    });

    req.on('error', (err) => {
      setErrorMessage(err.detail.message);
    });

    req.on('progress', (_progress) => {
      setProgress(Math.floor(_progress.detail));
    });

    req.on('success', () => {
      setIsPreparing(true);
    });
  }

  if (errorMessage) return <Alert severity='error'>{errorMessage}</Alert>;

  return (
    <Stack key='upload' alignItems='center' justifyContent='center' gap={1} width='100%' height='80px'>
      {isUploading ? (
        <>
          {isPreparing ? (
            <Typography>Preparing..</Typography>
          ) : (
            <Typography>Uploading...{progress ? `${progress}%` : ''}</Typography>
          )}
          <CircularProgress size={30} color='secondary' />
        </>
      ) : (
        <Button component='label' type='button'>
          Select a video file
          <input
            hidden
            type='file'
            onChange={(e) => {
              if (e.target.files) {
                startUpload(e.target.files?.[0]);
              }
            }}
          />
        </Button>
      )}
    </Stack>
  );
}
