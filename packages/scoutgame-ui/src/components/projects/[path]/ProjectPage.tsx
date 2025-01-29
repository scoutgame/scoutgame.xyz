import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Box, Container, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from '../../common/Button/BackButton';
import { chainRecords, ProjectRoleText } from '../constants';

import { EditProjectIcon } from './components/EditProjectIcon';

export function ProjectPage({ project }: { project: ScoutProjectDetailed }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Stack
          gap={{
            xs: 0.5,
            md: 1
          }}
          flexDirection='row'
          alignItems='center'
          bgcolor='background.paper'
          p={{
            xs: 1,
            md: 2
          }}
          px={{
            xs: 0.5,
            md: 1
          }}
          borderRadius={1}
        >
          <BackButton />
          <Image
            src={project.avatar || 'https://www.svgrepo.com/show/335614/project.svg'}
            alt={project.name}
            width={100}
            height={100}
            style={{ objectFit: 'cover' }}
          />
          <Stack gap={1} ml={1} flex={1}>
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <Typography variant='h5'>{project.name}</Typography>
              {project.github && (
                <Link href={project.github} target='_blank' style={{ alignItems: 'center', display: 'flex' }}>
                  <GitHubIcon />
                </Link>
              )}
              {project.website && (
                <Link href={project.website} target='_blank' style={{ alignItems: 'center', display: 'flex' }}>
                  <LanguageIcon />
                </Link>
              )}
            </Stack>
            <Typography>{project.description}</Typography>
          </Stack>
          <Box sx={{ alignSelf: 'flex-start' }}>
            <EditProjectIcon path={project.path} teamMembers={project.teamMembers} />
          </Box>
        </Stack>
        <Stack gap={1}>
          <Typography color='secondary' variant='h6'>
            Contracts
          </Typography>
          <Stack gap={1}>
            {project.contracts.length === 0 ? (
              <Typography>No contracts added</Typography>
            ) : (
              project.contracts.map((contract) => (
                <Stack
                  key={contract.id}
                  flexDirection='row'
                  alignItems='center'
                  gap={1}
                  bgcolor='background.paper'
                  px={1.5}
                  py={1}
                  borderRadius={1}
                >
                  <Image
                    src={chainRecords[contract.chainId].image}
                    alt={chainRecords[contract.chainId].name}
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%' }}
                  />
                  <Typography>{stringUtils.shortenHex(contract.address)}</Typography>
                </Stack>
              ))
            )}
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography color='secondary' variant='h6'>
            Team
          </Typography>
          <Stack gap={1}>
            {project.teamMembers.map((member) => (
              <Link href={`/u/${member.path}`} key={member.id}>
                <Stack
                  key={member.id}
                  flexDirection='row'
                  alignItems='center'
                  gap={1}
                  bgcolor='background.paper'
                  px={1.5}
                  py={1}
                  borderRadius={1}
                >
                  <Image
                    src={member.avatar}
                    alt={member.displayName}
                    width={25}
                    height={25}
                    style={{ borderRadius: '50%' }}
                  />
                  <Typography>{member.displayName}</Typography>
                  <Typography variant='caption' color='secondary'>
                    {ProjectRoleText[member.role as ScoutProjectMemberRole]}
                  </Typography>
                </Stack>
              </Link>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
