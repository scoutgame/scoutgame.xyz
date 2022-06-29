import { Box, Button, Chip, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import Modal from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import InlineCharmEditor from '../InlineCharmEditor';

interface PageInlineVoteProps {
  inlineVote: VoteWithUsers
  detailed?: boolean
}

export default function PageInlineVote ({ detailed = false, inlineVote }: PageInlineVoteProps) {
  const { deadline, description, title, userVotes, options, id } = inlineVote;
  const totalVotes = userVotes.length;
  const voteFrequencyRecord: Record<string, number> = useMemo(() => {
    return userVotes.reduce<Record<string, number>>((currentRecord, userVote) => {
      if (!currentRecord[userVote.choice]) {
        currentRecord[userVote.choice] = 1;
      }
      else {
        currentRecord[userVote.choice] += 1;
      }
      return currentRecord;
    }, {});
  }, [userVotes]);
  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });

  return (
    <div>
      <Typography variant='h5' fontWeight='bold'>
        {title}
      </Typography>
      <Typography
        color='secondary'
        variant='subtitle1'
        my={1}
      >
        {DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) })?.replace('in', '')} left
      </Typography>
      <Box my={1}>
        <InlineCharmEditor
          key={id}
          content={description}
          readOnly={true}
          style={{
            padding: 0
          }}
        />
      </Box>
      <div style={{
        fontWeight: 'bold',
        fontSize: 20
      }}
      >
        <span>Votes</span> <Chip size='small' label={totalVotes} />
      </div>
      <List sx={{
        display: 'flex',
        gap: 1,
        flexDirection: 'column',
        my: 1
      }}
      >
        {options.map((option, optionIndex) => (
          <>
            <ListItem sx={{ p: 0, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant='subtitle1'>{optionIndex + 1}.</Typography>
                <Typography variant='body1'>{option.name}</Typography>
              </Box>
              <Typography variant='subtitle1' color='secondary'>{((voteFrequencyRecord[option.name] / totalVotes) * 100).toFixed(2)}%</Typography>
            </ListItem>
            <Divider />
          </>
        ))}
      </List>
      {!detailed && <Button variant='outlined' onClick={inlineVoteDetailModal.open}>View details</Button>}
      {detailed && (
        <List>
            {userVotes.map(userVote => (
              <>
                <ListItem sx={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
                >
                  <UserDisplay user={userVote.user as any} />
                  {userVote.choice}
                </ListItem>
                <Divider />
              </>
            ))}
        </List>
      )}
      <Modal title='Vote details' size='large' open={inlineVoteDetailModal.isOpen} onClose={inlineVoteDetailModal.close}>
        <PageInlineVote inlineVote={inlineVote} detailed />
      </Modal>
    </div>
  );
}
