'use client';

import { Button, Tooltip } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';

import { useGlobalModal } from 'components/common/ModalProvider';

// Draft ends at midnight (end of day) UTC on April 25th, 2024
const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });

export function isDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function BidButton({ developerPath }: { developerPath: string }) {
  const { openModal } = useGlobalModal();
  const draftEnded = isDraftEnded();
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
      disabled={draftEnded}
    >
      Bid
    </Button>
  );

  if (draftEnded) {
    return (
      <Tooltip title='Draft has ended' placement='top'>
        <div>{button}</div>
      </Tooltip>
    );
  }

  return button;
}
