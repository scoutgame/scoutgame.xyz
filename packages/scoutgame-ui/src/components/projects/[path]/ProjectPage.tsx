import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { IconButton, Box, Container, Stack, Typography, Tooltip, Avatar } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getProjectByPath';
import { capitalize } from '@packages/utils/strings';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from '../../common/Button/BackButton';
import { GemsIcon, TransactionIcon } from '../../common/Icons';
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
          {project.contractDailyStats.length > 0 && (
            <Stack flexDirection='row' gap={2} alignItems='center' mr={2}>
              <Stack justifyContent='center' alignItems='center' flex={1}>
                <Typography color='secondary' width='100px' align='center' variant='body2'>
                  Current Week Transactions
                </Typography>
                <Typography fontSize='2em'>
                  {project.totalTxCount?.toLocaleString()} <TransactionIcon />
                </Typography>
              </Stack>
              <GemsIcon color={project.tier} size={60} />
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
              <Box textAlign='right' mr={3}>
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
              <Box textAlign='right' mr={3}>
                <Typography color='secondary'>Tx count</Typography>
              </Box>
            </Stack>
            {wallets.map((wallet) => (
              <AddressRow key={wallet.address} {...wallet} />
            ))}
          </Stack>
        )}
        <Stack gap={1}>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between'>
            <Typography color='secondary' variant='h6'>
              Team
            </Typography>
            {project.tier && (
              <Typography
                variant='h6'
                width={100}
                textAlign='center'
                sx={{ display: 'flex', alignItems: 'center', width: 'auto', gap: 0.5, mr: 3 }}
              >
                {capitalize(project.tier)} Tier: {project.totalGems} <GemsIcon color={project.tier} size={20} />
              </Typography>
            )}
          </Stack>
          <Stack gap={1}>
            {project.teamMembers.map((member) => (
              <ProjectPageMember key={member.id} member={member} projectTier={project.tier} />
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
        <Avatar src={chainRecords[chainId!].image} alt={chainRecords[chainId!].name} />
        <WalletAddress address={address} chainId={chainId!} />
        {/* <Chip label={type} size='small' color='primary' variant='outlined' /> */}
      </Stack>

      <Box textAlign='right' mr={3}>
        {typeof txCount === 'number' ? (
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {txCount} <TransactionIcon size={16} />
          </Typography>
        ) : (
          <Typography color='grey'>N/A</Typography>
        )}
      </Box>
    </Stack>
  );
}
