import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Button, Card, Chip, Divider, FormLabel, IconButton, List, ListItem, ListItemText, Menu, MenuItem, Radio, Typography } from '@mui/material';
import { VoteOptions } from '@prisma/client';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { useUser } from 'hooks/useUser';
import { removeInlineVoteMark } from 'lib/inline-votes/removeInlineVoteMark';
import { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';
import { DateTime } from 'luxon';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';

interface PageInlineVoteProps {
  inlineVote: ExtendedVote
  detailed?: boolean
}

const StyledDiv = styled.div<{ detailed: boolean }>`
  background-color: ${({ theme, detailed }) => detailed && theme.palette.mode !== 'light' ? theme.palette.background.default : theme.palette.background.light};
  padding: ${({ theme }) => theme.spacing(2)};
`;

interface PageInlineVoteOptionProps {
  voteId: string
  voteOption: VoteOptions
  percentage: number
  checked: boolean
  isDisabled: boolean
}

function PageInlineVoteOption (
  { isDisabled, voteOption, voteId, checked, percentage }: PageInlineVoteOptionProps
) {
  const { castVote } = useInlineVotes();
  const [user] = useUser();
  return (
    <>
      <ListItem sx={{ p: 0, justifyContent: 'space-between' }}>
        <Box display='flex' alignItems='center'>
          <Radio
            disabled={isDisabled || !user}
            disableRipple
            size='small'
            checked={checked}
            onChange={() => {
              castVote(voteId, voteOption.name);
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormLabel disabled={isDisabled}>{voteOption.name}</FormLabel>
          </Box>
        </Box>
        <Typography variant='subtitle1' color='secondary'>{percentage.toFixed(2)}%</Typography>
      </ListItem>
      <Divider />
    </>
  );
}

const MAX_DESCRIPTION_LENGTH = 200;

export default function PageInlineVote ({ detailed = false, inlineVote }: PageInlineVoteProps) {
  const { deadline, totalVotes, description, id, title, userChoice, voteOptions } = inlineVote;
  const [user] = useUser();
  const { cancelVote, deleteVote } = useInlineVotes();
  const { data: userVotes } = useSWR(detailed ? `/votes/${id}/user-votes` : null, () => charmClient.getUserVotes(id));

  const voteAggregateResult = inlineVote.aggregatedResult;

  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });
  const inlineVoteActionModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-action' });

  const voteCountLabel = (
    <Box sx={{
      fontWeight: 'bold',
      fontSize: 16,
      mt: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5
    }}
    >
      <span>Votes</span> <Chip size='small' label={totalVotes} />
    </Box>
  );

  const hasPassedDeadline = new Date(deadline) < new Date();

  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) });
  const isDescriptionAbove = description ? description.length > MAX_DESCRIPTION_LENGTH : false;
  const popupState = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const menuState = bindMenu(popupState);
  const view = useEditorViewContext();

  return (
    <StyledDiv detailed={detailed} id={`vote.${inlineVote.id}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          {title}
        </Typography>
        {inlineVote.createdBy === user?.id && (
          <IconButton size='small' onClick={inlineVoteActionModal.open}>
            <MoreHorizIcon fontSize='small' />
          </IconButton>
        )}
      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace(/^in/g, '')} left`}
        </Typography>
        <VoteStatusChip size='small' status={inlineVote.status} />
      </Box>
      {description && (
      <Box my={1} mb={2}>{isDescriptionAbove && !detailed ? (
        <span>
          {description.slice(0, 200)}...
          <Typography
            component='span'
            onClick={inlineVoteDetailModal.open}
            sx={{
              ml: 0.5,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            variant='subtitle1'
            fontWeight='bold'
          >(More)
          </Typography>
        </span>
      ) : description}
      </Box>
      )}
      {!detailed && voteCountLabel}
      <List sx={{
        display: 'flex',
        gap: 0.5,
        flexDirection: 'column'
      }}
      >
        {voteOptions.map((voteOption) => {
          const isDisabled = isVotingClosed(inlineVote);

          return (
            <PageInlineVoteOption
              key={voteOption.name}
              checked={voteOption.name === userChoice}
              isDisabled={isDisabled}
              voteOption={voteOption}
              percentage={((totalVotes === 0 ? 0 : (voteAggregateResult?.[voteOption.name] ?? 0) / totalVotes) * 100)}
              voteId={inlineVote.id}
            />
          );
        })}
      </List>
      {!detailed && <Button disabled={!user} variant='outlined' onClick={inlineVoteDetailModal.open}>View details</Button>}
      {detailed && (totalVotes !== 0 ? voteCountLabel : (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <HowToVoteOutlinedIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No votes casted yet. Be the first to vote !!!</Typography>
          </Box>
        </Card>
      ))}
      {detailed && userVotes && (
        <List>
          {userVotes.map(userVote => (
            <>
              <ListItem
                dense
                sx={{
                  px: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Avatar avatar={userVote.user.avatar} name={userVote.user.username} />
                <ListItemText
                  primary={<Typography>{userVote.user.username}</Typography>}
                  secondary={<Typography variant='subtitle1' color='secondary'>{DateTime.fromJSDate(new Date(userVote.updatedAt)).toRelative({ base: (DateTime.now()) })}</Typography>}
                />
                <Typography fontWeight={500} color='secondary'>{userVote.choice}</Typography>
              </ListItem>
              <Divider />
            </>
          ))}
        </List>
      )}
      <Modal title='Vote details' size='large' open={inlineVoteDetailModal.isOpen} onClose={inlineVoteDetailModal.close}>
        <PageInlineVote inlineVote={inlineVote} detailed />
      </Modal>
      <ConfirmDeleteModal
        title='Delete vote'
        onClose={popupState.close}
        open={menuState.open}
        buttonText={`Delete ${inlineVote.title}`}
        onConfirm={() => {
          removeInlineVoteMark(view, inlineVote.id);
          deleteVote(inlineVote.id);
        }}
        question={`Are you sure you want to delete this vote: ${inlineVote.title}?`}
      />
      <Menu
        {...bindMenu(inlineVoteActionModal)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        {inlineVote.status === 'InProgress' && !hasPassedDeadline && (
          <MenuItem
            dense
            onClick={() => {
              removeInlineVoteMark(view, inlineVote.id);
              cancelVote(inlineVote.id);
            }}
          >
            <DoNotDisturbIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Cancel</ListItemText>
          </MenuItem>
        )}
        <MenuItem dense onClick={() => popupState.open()}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </StyledDiv>
  );
}
