import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Container, Stack, Typography } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

import { chainRecords, ProjectRoleText } from '../constants';

export function ProjectPage({ project }: { project: UserScoutProject }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Stack gap={2} flexDirection='row' alignItems='center' bgcolor='background.paper' p={2} borderRadius={1}>
          <Image src={project.avatar} alt={project.name} width={100} height={100} />
          <Stack gap={1}>
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <Typography variant='h5'>{project.name}</Typography>
              <Link href={project.github} target='_blank' style={{ alignItems: 'center', display: 'flex' }}>
                <GitHubIcon />
              </Link>
              <Link href={project.website} target='_blank' style={{ alignItems: 'center', display: 'flex' }}>
                <LanguageIcon />
              </Link>
            </Stack>
            <Typography>{project.description}</Typography>
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography color='secondary' variant='h6'>
            Contracts
          </Typography>
          <Stack gap={1}>
            {project.contracts.map((contract) => (
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
                <Typography>{contract.address}</Typography>
                <Image
                  src={chainRecords[contract.chainId].image}
                  alt={chainRecords[contract.chainId].name}
                  width={20}
                  height={20}
                  style={{ borderRadius: '50%' }}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography color='secondary' variant='h6'>
            Team
          </Typography>
          <Stack gap={1}>
            {project.teamMembers.map((member) => (
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
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
