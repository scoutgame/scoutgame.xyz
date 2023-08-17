import PublishIcon from '@mui/icons-material/ElectricBolt';
import { Box, Chip, Divider, Tooltip, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';

import { Button } from 'components/common/Button';
import { useSnapshotVoting } from 'components/common/CharmEditor/components/inlineVote/hooks/useSnapshotVoting';
import Loader from 'components/common/LoadingComponent';
import { SnapshotVotingForm } from 'components/proposals/components/SnapshotVoting/SnapshotVotingForm';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { percent } from 'lib/utilities/numbers';

import { VotesWrapper } from './VotesWrapper';

type Props = {
  snapshotProposalId: string;
};

export function SnapshotVoteDetails({ snapshotProposalId }: Props) {
  const {
    snapshotProposal,
    userVotes,
    votingPower,
    isVotingActive,
    remainingTime,
    hasPassedDeadline,
    proposalEndDate,
    votingDisabledStatus
  } = useSnapshotVoting({
    snapshotProposalId
  });
  const { formatDate } = useDateFormatter();
  // Either the number of votes or tokens

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  const currentUserChoices = (userVotes ?? []).map((v) => voteChoices[v.choice - 1]).join(',');

  const isLoading = snapshotProposal === undefined;
  let statusText = 'Loading...';

  if (snapshotProposal) {
    if (snapshotProposal.state === 'pending') {
      statusText = 'Pending';
    } else if (hasPassedDeadline) {
      statusText = `Voting ended on ${formatDate(new Date(proposalEndDate))}`;
    } else {
      statusText = `Voting ends ${remainingTime}`;
    }
  } else if (!isLoading) {
    statusText = 'Not found';
  }

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        gap={1}
        alignItems='center'
        mb={2}
      >
        <Typography color='secondary' variant='subtitle1'>
          Status: {statusText}
        </Typography>
        <Button
          startIcon={<PublishIcon />}
          href={`https://snapshot.org/#/${snapshotProposal?.space.id}/proposal/${snapshotProposal?.id}`}
          color='secondary'
          variant='outlined'
          external
          target='_blank'
          disabled={!snapshotProposal}
        >
          View on Snapshot
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {!snapshotProposal && isLoading && <Loader isLoading={true} />}

      {!snapshotProposal && !isLoading && <Alert severity='warning'>Proposal not found on Snapshot</Alert>}

      {snapshotProposal && (
        <Box display='flex' flexDirection='column' gap={1}>
          {isVotingActive ? (
            <Tooltip title={votingDisabledStatus}>
              <Box>
                <SnapshotVotingForm
                  snapshotProposal={snapshotProposal}
                  votingPower={votingPower}
                  userVotes={userVotes}
                />
              </Box>
            </Tooltip>
          ) : (
            voteChoices.map((voteOption, index) => (
              <Box key={voteOption} display='flex' justifyContent='space-between'>
                <Box gap={1} display='flex'>
                  {voteOption}
                  {currentUserChoices.includes(voteOption) && <Chip color='teal' size='small' label='Voted' />}
                </Box>
                <Typography variant='subtitle1' color='secondary'>
                  {!voteScores[index]
                    ? 'No votes yet'
                    : percent({
                        value: voteScores[index],
                        total: snapshotProposal.scores_total,
                        significantDigits: 2
                      })}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </VotesWrapper>
  );
}
