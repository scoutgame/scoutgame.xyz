import EmailIcon from '@mui/icons-material/Email';
import XIcon from '@mui/icons-material/X';
import type { QuestType } from '@packages/scoutgame/quests/questRecords';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { PointsIcon } from '../../common/Icons';

const ScoutBinocularsIcon = <PointsIcon size={34} />;
const BuilderDogIcon = (
  <div style={{ position: 'relative', width: 34, height: 34 }}>
    <Image
      src='/images/profile/builder-dog.png'
      alt='Builder dog'
      width={52.5}
      height={52.5}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    />
  </div>
);

export const QuestIcon: Record<QuestType, ReactNode> = {
  'follow-x-account': <XIcon fontSize='large' />,
  'join-telegram-channel': <img src='/images/logos/telegram.png' alt='Telegram' width={32.5} height={32.5} />,
  'share-x-telegram': <XIcon fontSize='large' />,
  'invite-friend': ScoutBinocularsIcon,
  'scout-starter-card': ScoutBinocularsIcon,
  'scout-3-starter-cards': ScoutBinocularsIcon,
  'scout-full-season-card': ScoutBinocularsIcon,
  'scout-5-builders': ScoutBinocularsIcon,
  'scout-share-builder': ScoutBinocularsIcon,
  'share-weekly-claim': ScoutBinocularsIcon,
  'share-scout-profile': ScoutBinocularsIcon,
  'verify-email': <EmailIcon fontSize='large' />,
  // 'link-farcaster-telegram-account': ScoutBinocularsIcon,
  // 'enter-op-new-scout-competition': <Image src='/images/crypto/op.png' alt='OP' width={34} height={34} />,
  'score-first-commit': BuilderDogIcon,
  'score-first-pr': BuilderDogIcon,
  'score-streak': BuilderDogIcon,
  'first-repo-contribution': BuilderDogIcon,
  'contribute-celo-repo': <Image src='/images/crypto/celo.png' alt='Celo' width={34} height={34} />,
  'contribute-game7-repo': <Image src='/images/crypto/game7.png' alt='Game7' width={34} height={34} />,
  'contribute-octant-repo': <Image src='/images/logos/octant.png' alt='Octant' width={34} height={34} />,
  'share-builder-profile': BuilderDogIcon,
  // Dynamically added
  'link-farcaster-account': <img src='/images/logos/farcaster.png' alt='Farcaster' width={32.5} height={32.5} />,
  'link-telegram-account': <img src='/images/logos/telegram.png' alt='Telegram' width={32.5} height={32.5} />
};
