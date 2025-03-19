import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { IconButton, Box, Chip, Container, Stack, Typography, Tooltip } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getProjectByPath';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from '../../common/Button/BackButton';
import { WalletAddress } from '../../common/WalletAddress';
import { chainRecords } from '../constants';

import { EditProjectIcon } from './components/EditProjectIcon';
import { LeaveProjectButton } from './components/LeaveProjectButton';
import { OnchainActivityGraph } from './components/OnchainActivityGraph';
import { ProjectPageMember } from './components/ProjectPageMember';

export function ProjectPage({ project }: { project: ScoutProjectDetailed }) {
  const contracts = [...project.contracts.map((contract) => ({ ...contract, type: 'contract' }))];
  const wallets = project.wallets
    .filter((w) => w.chainType === 'evm' || !w.chainType)
    .map((wallet) => ({ ...wallet, type: 'agent' }));

  return (
    <Container maxWidth='md'>
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
          position='relative'
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
          {typeof project.totalTxCount === 'number' && (
            <Stack justifyContent='center' alignItems='center' flex={1}>
              <Typography color='secondary' width='100px' align='center' variant='body2'>
                Current Week Transactions
              </Typography>
              <Typography fontSize='2em'>{project.totalTxCount?.toLocaleString()} tx</Typography>
            </Stack>
          )}
          <Tooltip title='Edit project'>
            <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
              <IconButton>
                <EditProjectIcon path={project.path} teamMembers={project.teamMembers} />
              </IconButton>
            </Box>
          </Tooltip>
        </Stack>
        {contracts.length > 0 && (
          <Stack gap={1}>
            <OnchainActivityGraph data={project.contractDailyStats} />
            <Stack flexDirection='row' alignItems='center'>
              <Typography color='secondary' variant='h6' sx={{ flexGrow: 1 }}>
                Contracts
              </Typography>
              <Box width={100} textAlign='center'>
                <Typography color='secondary'>Tx count</Typography>
              </Box>
            </Stack>
            {contracts.map((contract) => (
              <AddressRow key={contract.address} {...contract} />
            ))}
          </Stack>
        )}
        {wallets.length > 0 && (
          <Stack gap={1}>
            <Stack flexDirection='row' alignItems='center'>
              <Typography color='secondary' variant='h6' sx={{ flexGrow: 1 }}>
                Agent wallets
              </Typography>
              <Box width={100} textAlign='center'>
                <Typography color='secondary'>Tx count</Typography>
              </Box>
            </Stack>
            {wallets.map((wallet) => (
              <AddressRow key={wallet.address} {...wallet} />
            ))}
          </Stack>
        )}
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

function AddressRow({
  address,
  chainId,
  txCount,
  type
}: {
  address: string;
  chainId: number | null;
  txCount?: number;
  type: string;
}) {
  return (
    <Stack
      key={address}
      flexDirection='row'
      alignItems='center'
      bgcolor='background.paper'
      pl={1.5}
      py={1}
      borderRadius={1}
    >
      <Stack gap={2} flexDirection='row' alignItems='center' flexGrow={1}>
        <Image
          src={chainRecords[chainId!].image}
          alt={chainRecords[chainId!].name}
          width={36}
          height={36}
          style={{ borderRadius: '50%' }}
        />
        <WalletAddress address={address} chainId={chainId!} />
        <Chip label={type} size='small' color='primary' variant='outlined' />
      </Stack>

      <Box width={100} textAlign='center'>
        {typeof txCount === 'number' ? (
          <Typography>{txCount} txs</Typography>
        ) : (
          <Typography color='grey'>N/A</Typography>
        )}
      </Box>
    </Stack>
  );
}
