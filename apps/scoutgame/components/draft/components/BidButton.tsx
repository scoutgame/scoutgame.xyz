'use client';

import { Badge, Button, Tooltip } from '@mui/material';
import { isEndOfDraftWeek } from '@packages/dates/utils';
import { isDraftEnabled } from '@packages/scoutgame/drafts/checkDraftDates';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useRouter } from 'next/navigation';

import { useGlobalModal } from 'components/common/ModalProvider';

export function BidButton({ developerPath, bidsReceived }: { developerPath: string; bidsReceived: number }) {
  const { openModal } = useGlobalModal();
  const { user } = useUser();
  const draftIsOver = isEndOfDraftWeek();
  const draftEnabled = isDraftEnabled() && !draftIsOver;
  const router = useRouter();

  const button = (
    <Badge
      badgeContent={bidsReceived}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: 'orange.dark',
          borderRadius: 0.5,
          zIndex: 0,
          padding: 0.35,
          fontSize: 12,
          fontWeight: 700,
          minWidth: 'fit-content',
          height: 'fit-content'
        }
      }}
    >
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
    </Badge>
  );

  return (
    <Tooltip title={draftEnabled ? '' : draftIsOver ? 'Draft has closed' : 'Draft has not started yet'} placement='top'>
      <span>{button}</span>
    </Tooltip>
  );
}
