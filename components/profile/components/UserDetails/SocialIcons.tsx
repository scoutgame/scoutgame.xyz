import { useTheme } from '@emotion/react';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import type { StackProps } from '@mui/material';
import { Link, Stack, SvgIcon } from '@mui/material';
import type { ReactNode } from 'react';

import DiscordIcon from 'public/images/discord_logo.svg';

import { DiscordSocialIcon } from './DiscordSocialIcon';

export function SocialIcons({
  children,
  social = {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  },
  showDiscord = true,
  showTwitter = true,
  showGithub = true,
  showLinkedIn = true,
  ...props
}: {
  showDiscord?: boolean;
  showTwitter?: boolean;
  showGithub?: boolean;
  showLinkedIn?: boolean;
  children?: ReactNode;
  social?: {
    twitterURL?: string;
    githubURL?: string;
    discordUsername?: string;
    linkedinURL?: string;
  };
} & StackProps) {
  const theme = useTheme();

  return (
    <Stack direction='row' alignItems='center' gap={2} {...props}>
      {showDiscord &&
        (social?.discordUsername && showDiscord ? (
          <DiscordSocialIcon username={social.discordUsername} />
        ) : (
          <SvgIcon color='disabled' sx={{ height: '22px' }}>
            <DiscordIcon />
          </SvgIcon>
        ))}
      {showTwitter &&
        (social.twitterURL ? (
          <Link href={social.twitterURL} target='_blank' display='flex'>
            <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
          </Link>
        ) : (
          <TwitterIcon color='disabled' style={{ height: '22px' }} />
        ))}
      {showLinkedIn &&
        (social?.linkedinURL ? (
          <Link href={social.linkedinURL} target='_blank' display='flex'>
            <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
          </Link>
        ) : (
          <LinkedInIcon color='disabled' style={{ height: '22px' }} />
        ))}
      {showGithub &&
        (social.githubURL ? (
          <Link href={social.githubURL} target='_blank' display='flex'>
            <GitHubIcon style={{ color: '#888', height: '22px' }} />
          </Link>
        ) : (
          <GitHubIcon color='disabled' style={{ height: '22px' }} />
        ))}
      {children}
    </Stack>
  );
}
