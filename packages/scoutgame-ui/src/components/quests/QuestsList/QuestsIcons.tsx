import XIcon from '@mui/icons-material/X';
import type { QuestType } from '@packages/scoutgame/quests/questRecords';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { PointsIcon } from '../../common/Icons';

const ScoutBinocularsIcon = <PointsIcon size={34} color='default' />;
const BuilderDogIcon = (
  <div style={{ position: 'relative', width: 34, height: 34 }}>
    <Image
      src='/images/profile/builder-dog.png'
      alt='Builder dog'
      width={60}
      height={60}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    />
  </div>
);

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
  'enter-op-new-scout-competition': <Image src='/images/crypto/op.png' alt='OP' width={34} height={34} />,
  'score-first-commit': BuilderDogIcon,
  'score-first-pr': BuilderDogIcon,
  'score-streak': BuilderDogIcon,
  'first-repo-contribution': BuilderDogIcon,
  'contribute-celo-repo': <Image src='/images/crypto/celo.png' alt='Celo' width={34} height={34} />,
  'contribute-game7-repo': <Image src='/images/crypto/game7.png' alt='Game7' width={34} height={34} />,
  'contribute-lit-repo': <Image src='/images/crypto/lit.png' alt='Lit' width={34} height={34} />,
  'share-builder-profile': BuilderDogIcon
};
