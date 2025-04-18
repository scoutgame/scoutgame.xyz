'use client';

import { Button, Tooltip } from '@mui/material';
import { isDraftEnabled } from '@packages/scoutgame/drafts/checkDraftDates';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useRouter } from 'next/navigation';

import { useGlobalModal } from 'components/common/ModalProvider';

export function BidButton({ developerPath }: { developerPath: string }) {
  const { openModal } = useGlobalModal();
  const draftEnabled = isDraftEnabled();
  const { user } = useUser();
  const router = useRouter();

  const button = (
    <Button
      sx={{
        px: { xs: 0.5, md: 2 },
        py: { xs: 0.5, md: 1 },
        maxWidth: { xs: '40px', md: '80px' },
        minWidth: { xs: '40px', md: '80px' },
        borderRadius: 1,
        fontSize: { xs: 12, md: 16 }
      }}
      onClick={() => {
        if (!user) {
          router.push('/login');
        } else {
          openModal('draftDeveloper', { path: developerPath });
        }
      }}
      color='secondary'
      disabled={!draftEnabled}
    >
      Bid
    </Button>
  );

  if (!draftEnabled) {
    return (
      <Tooltip title='Draft has closed or not started yet' placement='top'>
        <div>{button}</div>
      </Tooltip>
    );
  }

  return button;
}
