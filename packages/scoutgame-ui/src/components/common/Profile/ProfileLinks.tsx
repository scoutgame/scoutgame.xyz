import { IconButton, Tooltip, Chip } from '@mui/material';
import type { TalentProfile } from '@packages/users/getUserByPath';
import Image from 'next/image';
import Link from 'next/link';

import { useMdScreen } from '../../../hooks/useMediaScreens';

export function ProfileLinks({
  farcasterName,
  githubLogin,
  talentProfile
}: {
  farcasterName?: string | null;
  githubLogin?: string | null;
  talentProfile?: TalentProfile | null;
}) {
  const isDesktop = useMdScreen();
  return (
    <>
      {farcasterName ? (
        <IconButton
          href={`https://farcaster.xyz/${farcasterName}`}
          target='_blank'
          rel='noopener noreferrer'
          sx={{ px: 0 }}
        >
          <Image
            src='/images/logos/farcaster.png'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='farcaster icon'
          />
        </IconButton>
      ) : null}
      {githubLogin ? (
        <IconButton href={`https://github.com/${githubLogin}`} target='_blank' rel='noopener noreferrer' sx={{ px: 0 }}>
          <Image
            src='/images/profile/icons/github-circle-icon.svg'
            width={isDesktop ? '24' : '18'}
            height={isDesktop ? '24' : '18'}
            alt='github icon'
          />
        </IconButton>
      ) : null}
      {talentProfile ? (
        <Tooltip title='Talent protocol score'>
          <Chip
            sx={{ cursor: 'pointer', border: '2px solid rgb(130, 106, 238)', fontWeight: 600 }}
            component={Link}
            target='_blank'
            href={`https://passport.talentprotocol.com/profile/${talentProfile.id}`}
            avatar={
              <Image
                src='/images/crypto/talent.jpg'
                alt='talent icon'
                width={14}
                height={14}
                style={{ borderRadius: '50%' }}
              />
            }
            label={talentProfile.score}
            variant='outlined'
          />
        </Tooltip>
      ) : null}
    </>
  );
}
