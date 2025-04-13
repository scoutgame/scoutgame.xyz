'use client';

import { Button } from '@mui/material';

import { useGlobalModal } from 'components/common/ModalProvider';

export function BidButton({ developerPath }: { developerPath: string }) {
  const { openModal } = useGlobalModal();

  return (
    <Button
      sx={{
        px: { xs: 0.5, md: 2 },
        py: { xs: 0.5, md: 1 },
        maxWidth: { xs: '40px', md: '80px' },
        minWidth: { xs: '40px', md: '80px' },
        borderRadius: 1,
        fontSize: { xs: 12, md: 16 }
      }}
      onClick={() => openModal('draftDeveloper', { path: developerPath })}
      color='secondary'
    >
      Bid
    </Button>
  );
}
