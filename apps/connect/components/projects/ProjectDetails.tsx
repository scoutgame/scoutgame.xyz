import { fetchProject } from '@connect/lib/actions/fetchProject';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import { Button, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';

import { Avatar } from '../common/Avatar';
import { FarcasterCard } from '../common/FarcasterCard';
import { PageWrapper } from '../common/PageWrapper';

import { ShareButton } from './ProjectShareButton';

export async function ProjectDetails({ projectId }: { projectId: string }) {
  const project = await fetchProject(projectId);

  if (!project)
    return (
      <PageWrapper>
        <Typography mt={1} variant='h6'>
          Project not found
        </Typography>
      </PageWrapper>
    );

  return (
    <PageWrapper
      sx={{
        position: 'relative',
        p: 0
      }}
    >
      <img
        src={
          project.coverImage ||
          'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/9b2b00af-9644-43aa-add1-cde22f0253c3/breaking_wave.jpg'
        }
        alt={project.name}
        width='100%'
        height='150px'
        style={{
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
          top: '100px',
          marginLeft: '24px'
        }}
        variant='rounded'
      />
      <Stack p={3} mt={4}>
        <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{project.name}</Typography>
          <ShareButton />
        </Stack>
        <Stack gap={1}>
          {project.github && (
            <Stack direction='row' gap={1}>
              <GitHubIcon />
              <Link href={project.github} passHref target='_blank'>
                <Typography variant='body1'>{project.github.replace('https://github.com/', '')}</Typography>
              </Link>
            </Stack>
          )}
          {project.websites.length > 0 && (
            <Stack direction='row' gap={1}>
              <LanguageIcon color='secondary' />
              <Link href={project.websites[0]} passHref target='_blank'>
                <Typography variant='body1'>{project.websites[0].replace(/https?:\/\//, '')}</Typography>
              </Link>
            </Stack>
          )}
        </Stack>
        {project.description && (
          <Typography variant='body1' mt={2}>
            {project.description}
          </Typography>
        )}
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
            />
          ))}
        </Stack>
      </Stack>
    </PageWrapper>
  );
}
