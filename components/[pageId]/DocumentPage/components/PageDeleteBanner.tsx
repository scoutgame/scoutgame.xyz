import { Box, Button } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { StyledBanner } from 'components/common/Banners/Banner';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

export default function PageDeleteBanner({ pageId }: { pageId: string }) {
  const [isMutating, setIsMutating] = useState(false);
  const { space } = useCurrentSpace();
  const router = useRouter();
  const { pages } = usePages();

  async function restorePage() {
    if (space) {
      await charmClient.restorePage(pageId);
      await mutate(`pages/${space.id}`);
    }
  }

  async function deletePage() {
    if (space) {
      await router.push(
        `/${router.query.domain}/${
          Object.values(pages).find((page) => page?.type !== 'card' && !page?.deletedAt)?.path
        }`
      );
      await charmClient.deletePage(pageId);
    }
  }

  return (
    <StyledBanner errorBackground>
      <Box display='flex' gap={1} alignItems='center' data-test='archived-page-banner'>
        <div
          style={{
            color: 'white',
            fontWeight: 600
          }}
        >
          This page is in Trash
        </div>
        <Button
          data-test='banner--restore-archived-page'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await restorePage();
            setIsMutating(false);
          }}
          variant='outlined'
          size='small'
        >
          Restore Page
        </Button>
        <Button
          data-test='banner--permanently-delete'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await deletePage();
            setIsMutating(false);
          }}
          variant='outlined'
          size='small'
        >
          Delete permanently
        </Button>
      </Box>
    </StyledBanner>
  );
}
