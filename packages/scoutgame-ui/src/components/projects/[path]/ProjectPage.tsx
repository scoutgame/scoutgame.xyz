import { stringUtils } from '@charmverse/core/utilities';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Box, Chip, Container, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from '../../common/Button/BackButton';
import { chainRecords } from '../constants';

import { EditProjectIcon } from './components/EditProjectIcon';
import { LeaveProjectButton } from './components/LeaveProjectButton';
import { ProjectPageMember } from './components/ProjectPageMember';

export function ProjectPage({ project }: { project: ScoutProjectDetailed }) {
  const contractsAndAgentWallets = [
    ...project.contracts.map((contract) => ({ ...contract, type: 'contract' })),
    ...project.wallets.filter((w) => w.chainType === 'evm').map((wallet) => ({ ...wallet, type: 'agent' }))
  ];

  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Projects
        </Typography>
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
              <Typography data-test='project-name' variant='h5'>
                {project.name}
              </Typography>
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
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.description}</Typography>
          </Stack>
          <Box sx={{ alignSelf: 'flex-start' }}>
            <EditProjectIcon path={project.path} teamMembers={project.teamMembers} />
          </Box>
        </Stack>
        <Stack gap={1}>
          <Typography color='secondary' variant='h6'>
            dApps & Agent Wallets
          </Typography>
          <Stack gap={1}>
            {project.contracts.length === 0 && project.wallets.length === 0 ? (
              <Typography>No contracts or agent wallets added</Typography>
            ) : (
              contractsAndAgentWallets.map((contract) => (
                <Stack
                  key={contract.address}
                  flexDirection='row'
                  alignItems='center'
                  gap={1}
                  bgcolor='background.paper'
                  px={1.5}
                  py={1}
                  borderRadius={1}
                >
                  <Image
                    src={chainRecords[contract.chainId!].image}
                    alt={chainRecords[contract.chainId!].name}
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%' }}
                  />
                  <Typography>{stringUtils.shortenHex(contract.address)}</Typography>
                  <Chip label={contract.type} size='small' color='primary' variant='outlined' />
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
              <ProjectPageMember key={member.id} member={member} />
            ))}
          </Stack>
        </Stack>
        <LeaveProjectButton project={project} />
      </Stack>
    </Container>
  );
}
