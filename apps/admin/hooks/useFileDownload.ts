import { log } from '@charmverse/core/log';
import { useGETtrigger } from '@packages/scoutgame-ui/hooks/helpers';
import { useCallback } from 'react';

export function useFileDownload(src: string, filename: string) {
  const { trigger, isMutating } = useGETtrigger<undefined, string>(src, { timeout: 60000 });
  const onClick = useCallback(async () => {
    try {
      const response = await trigger();
      const url = window.URL.createObjectURL(new Blob([response], { type: 'text/tsv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      log.error('Error downloading file', error);
      alert(`There was an error downloading the file. Please try again: ${(error as Error).message}`);
    }
  }, [trigger, filename]);
  return { isDownloading: isMutating, downloadFile: onClick };
}
