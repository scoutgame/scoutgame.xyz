import 'server-only';

import type { ConnectProjectDetails } from '@connect/lib/actions/fetchProject';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { Avatar } from '../../common/Avatar';
import { FarcasterCard } from '../../common/FarcasterCard';
import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDescription } from '../components/ProjectDescription';
import { ShareButton } from '../ProjectShareButton';

function replaceUrl(link: string, domain: string) {
  let protocol = '';
  let href = link;
  let text = link;

  try {
    const url = new URL(link);
    protocol = url.protocol;
    href = url.href;
    text = (url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname) || url.hostname;
  } catch (e) {
    protocol = 'https://';
    href = `${protocol}${domain}/${link}`;
  }

  return {
    href,
    text
  };
}

export async function ProjectDetailsPage({ project }: { project?: ConnectProjectDetails | null }) {
  const farcasterLink = project?.farcasterValues[0] ? replaceUrl(project.farcasterValues[0], 'warpcast.com') : null;
  const githubLink = project?.github ? replaceUrl(project.github, 'github.com') : null;
  const mirrorLink = project?.mirror ? replaceUrl(project.mirror, 'mirror.xyz') : null;
  const twitterLink = project?.twitter ? replaceUrl(project.twitter, 'twitter.com') : null;
  return (
    <PageWrapper backToProfileHeader>
      {!project ? (
        <Typography mt={5} p={2} variant='h6'>
          Project not found
        </Typography>
      ) : (
        <>
          <img
            src={
              project.coverImage ||
              'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/9b2b00af-9644-43aa-add1-cde22f0253c3/breaking_wave.jpg'
            }
            alt={project.name}
            width='100%'
            height='150px'
            style={{
              marginTop: 40,
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <Avatar
            avatar={project.avatar ?? undefined}
            name={!project.avatar ? project.name : undefined}
            alt={project.name}
            size='xLarge'
            sx={{
              position: 'absolute',
              top: '130px',
              marginLeft: '24px'
            }}
            variant='rounded'
          />
          <Stack p={3} mt={4}>
            <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center'>
              <Typography variant='h5'>{project.name}</Typography>
              <ShareButton projectId={project.id} />
            </Stack>
            <Stack gap={1.5}>
              {farcasterLink && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <img src='/images/farcaster.png' width={25} height={25} />
                  <Link href={farcasterLink.href} passHref target='_blank'>
                    <Typography variant='body1'>{farcasterLink.text}</Typography>
                  </Link>
                </Stack>
              )}
              {githubLink && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <GitHubIcon />
                  <Link href={githubLink.href} passHref target='_blank'>
                    <Typography variant='body1'>{githubLink.text}</Typography>
                  </Link>
                </Stack>
              )}
              {project.websites.length > 0 && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <LanguageIcon color='secondary' />
                  <Link href={project.websites[0]} passHref target='_blank'>
                    <Typography variant='body1'>{project.websites[0].replace(/https?:\/\//, '')}</Typography>
                  </Link>
                </Stack>
              )}
              {mirrorLink && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <img src='/images/mirror-xyz.png' width={25} height={25} />
                  <Link href={mirrorLink.href} passHref target='_blank'>
                    <Typography variant='body1'>{mirrorLink.text}</Typography>
                  </Link>
                </Stack>
              )}
              {twitterLink && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <FaXTwitter
                    style={{
                      width: 24,
                      height: 24
                    }}
                  />
                  <Link href={twitterLink.href} passHref target='_blank'>
                    <Typography variant='body1'>{twitterLink.text}</Typography>
                  </Link>
                </Stack>
              )}
            </Stack>
            {project.description && <ProjectDescription description={project.description} />}
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6'>Members</Typography>
            <Stack gap={1}>
              {project.projectMembers.map((member) => (
                <FarcasterCard
                  fid={member.farcasterUser.fid}
                  key={member.farcasterUser.fid}
                  name={member.farcasterUser.displayName}
                  username={member.farcasterUser.username}
                  avatar={member.farcasterUser.pfpUrl}
                  bio={member.farcasterUser.bio}
                  enableLink
                />
              ))}
            </Stack>
          </Stack>
        </>
      )}
    </PageWrapper>
  );
}
