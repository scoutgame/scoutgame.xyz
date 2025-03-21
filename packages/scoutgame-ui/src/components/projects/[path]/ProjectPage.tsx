import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { IconButton, Box, Container, Stack, Typography, Tooltip, Avatar } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getProjectByPath';
import { capitalize } from '@packages/utils/strings';
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
          <Avatar
            src={project.avatar}
            alt={project.name}
            sx={{
              width: 100,
              height: 100,
              fontSize: 14,
              fontWeight: 600
            }}
            variant='square'
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
          {!project.stats.loading && (
            <Stack flexDirection='row' gap={2} alignItems='center' mr={2}>
              <Stack justifyContent='center' alignItems='center' flex={1}>
                <Typography color='secondary' width='100px' align='center' variant='body2'>
                  Current Week Transactions
                </Typography>
                <Typography fontSize='2em'>
                  {project.stats.loading ? 0 : project.stats.totalTxCount?.toLocaleString()} <TransactionIcon />
                </Typography>
              </Stack>
              <div style={{ display: project.stats.loading ? 'none' : 'block' }}>
                <GemsIcon color={project.tier} size={60} />
              </div>
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
            <OnchainActivityGraph data={project.stats.contractDailyStats} loading={project.stats.loading} />
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
                {capitalize(project.tier)} Tier: {project.stats.totalGems} <GemsIcon color={project.tier} size={20} />
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
  loadingStats
}: {
  address: string;
  chainId: number | null;
  txCount?: number;
  loadingStats: boolean;
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
        {!loadingStats ? (
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
