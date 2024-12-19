import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import XIcon from '@mui/icons-material/X';
import type { QuestType } from '@packages/scoutgame/quests/questRecords';
import Image from 'next/image';
import type { ReactNode } from 'react';

const ScoutBinocularsIcon = <Image src='/images/scout-binoculars.svg' alt='Scout binoculars' width={34} height={34} />;

export const QuestIcon: Record<QuestType, ReactNode> = {
  'follow-x-account': <XIcon fontSize='large' />,
  'share-x-telegram': <XIcon fontSize='large' />,
  'invite-friend': ScoutBinocularsIcon,
  'scout-starter-card': ScoutBinocularsIcon,
  'scout-3-starter-cards': ScoutBinocularsIcon,
  'scout-full-season-card': ScoutBinocularsIcon,
  'scout-5-builders': <Image src='/images/glo-dollar.svg' alt='Glo Dollar' width={34} height={34} />,
  'scout-share-builder': ScoutBinocularsIcon,
  'share-weekly-claim': ScoutBinocularsIcon,
  'share-scout-profile': ScoutBinocularsIcon,
  // 'link-farcaster-telegram-account': ScoutBinocularsIcon,
  'scout-moxie-builder': (
    <div
      style={{
        width: 35,
        height: 35,
        borderRadius: '50%',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Image src='/images/moxie.svg' alt='Scout moxie' width={20} height={20} />
    </div>
  ),
  'enter-op-new-scout-competition': <Image src='/images/crypto/op.png' alt='OP' width={34} height={34} />
};
