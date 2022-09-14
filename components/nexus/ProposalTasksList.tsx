import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Alert, Button, Card, Grid, Link, Typography } from '@mui/material';
import { Box } from '@mui/system';
import LoadingComponent from 'components/common/LoadingComponent';
import { ProposalStatusChip } from 'components/proposals/components/ProposalStatusBadge';
import { ProposalTask } from 'lib/proposal/interface';
import { GetTasksResponse } from 'pages/api/tasks/list';

const ProposalActionRecord: Record<ProposalTask['action'], string> = {
  discuss: 'Discuss',
  start_discussion: 'Start discussion',
  review: 'Review',
  start_vote: 'Start vote',
  vote: 'Vote',
  start_review: 'Start review'
};

/**
 * Page only needs to be provided for proposal type proposals
 */
export function ProposalTasksListRow (
  props: {proposalTask: ProposalTask}
) {

  const {
    proposalTask
  } = props;

  const {
    spaceDomain,
    pagePath,
    spaceName,
    pageTitle,
    action,
    id,
    status
  } = proposalTask;

  const proposalLink = `/${spaceDomain}/${pagePath}`;
  const proposalLocation = `${pageTitle || 'Untitled'} in ${spaceName}`;

  return (
    <Box>
      <Card sx={{ width: '100%', px: 2, py: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
        <Grid justifyContent='space-between' alignItems='center' gap={1} container>
          <Grid
            item
            xs={12}
            sm={12}
            md={3}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              mr: 1,
              alignItems: 'center',
              display: 'flex',
              gap: 0.5
            }}
            fontSize={{ sm: 16, xs: 18 }}
          >
            {pageTitle || 'Untitled'}
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            sx={{
              fontSize: { xs: 14, sm: 'inherit' }
            }}
          >
            <Link href={proposalLink} display='flex'>
              {proposalLocation}
            </Link>
          </Grid>
          <Grid item md={2} display='flex' justifyContent='center'>
            <ProposalStatusChip status={status} />
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            md={2}
            justifyContent={{
              xs: 'flex-start',
              md: 'flex-end'
            }}
            display='flex'
          >
            <Button
              sx={{
                width: {
                  xs: 'fit-content',
                  md: 100
                }
              }}
              href={proposalLink}
            >{ProposalActionRecord[action]}
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}

export default function ProposalTasksList ({
  tasks,
  error
} : {
  error: any
  tasks: GetTasksResponse | undefined
}) {

  if (error) {
    return (
      <Box>
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      </Box>
    );
  }
  else if (!tasks?.proposals) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalProposals = tasks?.proposals.length ?? 0;

  if (totalProposals === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <TaskOutlinedIcon />
          <Typography color='secondary'>You don't have any proposals right now</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      {tasks.proposals.map(proposal => <ProposalTasksListRow key={proposal.id} proposalTask={proposal} />)}
    </>
  );
}
