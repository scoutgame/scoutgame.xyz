
import { Box, Divider, Grid, Tab, Tabs, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import ForumIcon from '@mui/icons-material/Forum';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { silentlyUpdateURL } from 'lib/browser';
import { useState } from 'react';
import { useTheme } from '@emotion/react';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import GnosisTasksList from './GnosisTasksList';
import MentionedTasksList from './MentionedTasksList';
import TasksPageHeader from './TasksPageHeader';
import NexusPageTitle from './components/NexusPageTitle';
import NotifyMeButton from './components/NotifyMeButton';
import SnoozeButton from './components/SnoozeButton';
import useTasks from './hooks/useTasks';
import { VoteTasksList } from './VoteTasksList';

const tabStyles = {
  mb: 2,
  minHeight: {
    xs: '34px',
    sm: '48px'
  },
  '.MuiTab-root': {
    p: {
      xs: 0,
      sm: 1
    },
    minWidth: {
      xs: 'fit-content',
      sm: '90px'
    },
    flexGrow: {
      xs: 1,
      sm: 'revert'
    }
  }
};

const TASK_TABS = [
  { icon: <KeyIcon />, label: 'Multisig', type: 'multisig' },
  // { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'discussion' }
] as const;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

export default function TasksPage () {
  const router = useRouter();
  const [currentTask, setCurrentTask] = useState(router.query?.task ?? 'multisig');
  const { error, mutate: mutateTasks, tasks } = useTasks();
  const theme = useTheme();
  return (
    <>
      <NexusPageTitle />
      <TasksPageHeader />
      <Grid container spacing={{ xs: 1, sm: 3 }} sx={{ pt: 6, pb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Box>
            <StyledTypography>
              My tasks
            </StyledTypography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display='flex' alignItems='center' justifyContent={{ sm: 'flex-end', xs: 'flex-start' }} gap={{ sm: 2, xs: 1 }}>
            <NotifyMeButton />
            {currentTask === 'multisig' ? <SnoozeButton /> : null }
          </Box>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 2 }} />
      <Tabs
        sx={tabStyles}
        indicatorColor='primary'
        value={TASK_TABS.findIndex(taskTab => taskTab.type === currentTask)}
      >
        {TASK_TABS.map(task => (
          <Tab
            component='div'
            disableRipple
            iconPosition='start'
            icon={task.icon}
            key={task.label}
            sx={{
              px: 1.5,
              fontSize: 14,
              minHeight: 0,
              '&.MuiTab-root': {
                opacity: 0.75,
                color: theme.palette.textPrimary.main
              }
            }}
            label={task.label}
            onClick={() => {
              silentlyUpdateURL(`${window.location.origin}/nexus?task=${task.type}`);
              setCurrentTask(task.type);
            }}
          />
        ))}
      </Tabs>
      {currentTask === 'multisig' ? <GnosisTasksList error={error} mutateTasks={mutateTasks} tasks={tasks} /> : currentTask === 'discussion' ? <MentionedTasksList mutateTasks={mutateTasks} error={error} tasks={tasks} /> : currentTask === 'vote' ? <VoteTasksList mutateTasks={mutateTasks} error={error} tasks={tasks} /> : null}
    </>
  );
}
