import { log } from '@charmverse/core/log';
import { DeleteOutlined as TrashIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  Tooltip,
  Chip,
  Link,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import { capitalize, fancyTrimWords } from '@packages/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import React, { useState } from 'react';
import { mutate } from 'swr';

import { useGetGithubUserStats, useDeleteGithubUserStrike } from 'hooks/api/github';
import { useCreateBuilder } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { ScoutGameUser } from 'lib/users/getUsers';
import { setBuilderStatusAction } from 'lib/users/updateUserAction';

type Props = {
  open: boolean;
  user: Pick<
    ScoutGameUser,
    'builderStatus' | 'id' | 'githubLogin' | 'farcasterName' | 'path' | 'createdAt' | 'reappliedAt' | 'displayName'
  >;
  onClose: () => void;
  onSave: () => void;
};
export function BuilderReviewModal({ user, open, onClose, onSave }: Props) {
  const [githubLogin, setTextInput] = useState('');
  const { trigger: createUser, error: createBuilderError, isMutating: isCreating } = useCreateBuilder();
  const githubLoginDebounced = useDebouncedValue(githubLogin);

  const { execute: setBuilderStatus, isExecuting: isExecutingUpdate } = useAction(setBuilderStatusAction, {
    onSuccess: async () => {
      onClose();
      onSave();
    },
    onError(err) {
      log.error('Error suspending user', { error: err.error.serverError });
    }
  });

  const requireGithubLogin = !user.githubLogin;

  const githubLoginDisplayed = githubLogin || user.githubLogin;

  const { trigger: deleteGithubUserStrike } = useDeleteGithubUserStrike();
  const {
    data: githubUserStats,
    error: githubError,
    mutate: refreshGithubUserStats
  } = useGetGithubUserStats(githubLoginDisplayed);

  const isSuspended = user.builderStatus === 'banned';
  const cannotUnsuspend =
    isSuspended && githubUserStats && githubUserStats.builderStrikes.filter((strike) => !strike.deletedAt).length >= 3;

  async function unsuspendBuilder() {
    await setBuilderStatus({ userId: user.id, status: 'approved' });
  }

  async function rejectBuilder() {
    await setBuilderStatus({ userId: user.id, status: 'rejected' });
  }

  async function reapplyBuilder() {
    await setBuilderStatus({ userId: user.id, status: 'applied' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (user.builderStatus === 'banned') {
      await unsuspendBuilder();
    } else {
      await createUser({ userId: user.id, githubLogin });
      setTextInput('');
    }
    onClose();
    onSave();
    // clear SWR cache
    mutate(
      (key) => true, // which cache keys are updated
      undefined // update cache data to `undefined`
      // { revalidate: false } // do not revalidate
    );
  }

  async function deleteStrike(strikeId: string) {
    await deleteGithubUserStrike({ strikeId });
    refreshGithubUserStats();
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 600 } }} fullWidth>
      <DialogTitle sx={{}}>
        {user.builderStatus ? 'Review ' : 'Add '} {user.displayName}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack gap={2}>
            <Stack direction='row' alignItems='center'>
              <Typography sx={{ width: '120px' }}>Status:</Typography>
              {user.builderStatus ? (
                <Chip
                  size='small'
                  variant='outlined'
                  color={
                    user.builderStatus === 'applied'
                      ? 'warning'
                      : user.builderStatus === 'rejected'
                        ? 'error'
                        : undefined
                  }
                  label={capitalize(user.builderStatus)}
                />
              ) : (
                'N/A'
              )}
              {user.builderStatus === 'applied' && (
                <Typography variant='caption' color='secondary' sx={{ ml: 1 }}>
                  Applied on {new Date(user.reappliedAt || user.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Stack>
            <Stack direction='row'>
              <Typography sx={{ width: '120px' }}>Scout Game:</Typography>
              <Link href={`https://scoutgame.xyz/u/${user.path}`} target='_blank' sx={{ mr: 2 }}>
                {`https://scoutgame.xyz/u/${user.path}`}
              </Link>
            </Stack>
            {user.farcasterName && (
              <Stack direction='row'>
                <Typography sx={{ width: '120px' }}>Farcaster:</Typography>
                <Link href={`https://warpcast.com/${user.farcasterName}`} target='_blank'>
                  https://warpcast.com/{user.farcasterName}
                </Link>
              </Stack>
            )}
            <Stack direction='row'>
              <Typography sx={{ width: '120px' }}>Github:</Typography>
              <Stack flexGrow={1} gap={1}>
                {requireGithubLogin && (
                  <TextField
                    autoFocus
                    placeholder='Provide a Github login'
                    type='text'
                    fullWidth
                    value={githubLogin}
                    onChange={(e) => setTextInput(e.target.value)}
                    required
                    size='small'
                    sx={{ my: 0.5 }}
                  />
                )}
                {githubLoginDisplayed ? (
                  <Link href={`https://github.com/${githubLoginDisplayed}`} target='_blank'>
                    https://github.com/{githubLoginDisplayed}
                  </Link>
                ) : (
                  <>&nbsp;</>
                )}
                {githubLoginDisplayed && (
                  <Stack gap={1}>
                    {githubUserStats ? (
                      <>
                        <Typography component='span' variant='caption'>
                          Last commit:{' '}
                          {githubUserStats.lastCommit ? (
                            <ul style={{ paddingLeft: 16 }}>
                              <li>
                                <Link href={githubUserStats.lastCommit.url} target='_blank'>
                                  {fancyTrimWords(githubUserStats.lastCommit.title, 8)}
                                  <br />
                                  <Typography color='secondary' variant='caption' component='span'>
                                    {new Date(githubUserStats.lastCommit.date).toLocaleDateString()} -{' '}
                                    {githubUserStats.lastCommit.repo}
                                  </Typography>
                                </Link>
                              </li>
                            </ul>
                          ) : (
                            <em>N/A</em>
                          )}
                        </Typography>
                        {githubUserStats.builderStrikes.length > 0 && (
                          <span>
                            <Typography variant='caption' color='warning'>
                              Closed pull requests:
                            </Typography>
                            <ul style={{ paddingLeft: 16 }}>
                              {githubUserStats.builderStrikes.map((strike) => (
                                <li key={strike.githubEvent.url}>
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      width: '100%',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      textDecoration: strike.deletedAt ? 'line-through' : 'none',
                                      textDecorationColor: 'var(--mui-palette-primary-main)'
                                    }}
                                  >
                                    <Link href={strike.githubEvent.url} target='_blank'>
                                      {fancyTrimWords(strike.githubEvent.title, 10)}
                                      <br />
                                      <Typography color='secondary' variant='caption' component='span'>
                                        {new Date(strike.createdAt).toLocaleDateString()} -{' '}
                                        {strike.githubEvent.repo.owner}/{strike.githubEvent.repo.name}
                                      </Typography>
                                    </Link>
                                    {!strike.deletedAt && (
                                      <Tooltip title='Delete strike'>
                                        <IconButton size='small' onClick={() => deleteStrike(strike.id)}>
                                          <TrashIcon
                                            color='error'
                                            sx={{ fontSize: '0.75em', verticalAlign: 'middle' }}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </span>
                        )}
                      </>
                    ) : (
                      <Typography variant='caption' component='em'>
                        {githubError ? 'Error loading Github data' : 'Loading...'}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
            {createBuilderError && (
              <Box p={1}>
                <Typography variant='caption' color='error'>
                  {createBuilderError.message || 'Failed to save builder'}
                </Typography>
              </Box>
            )}
            {user.builderStatus !== 'approved' && (
              <Stack direction='row' spacing={2} justifyContent='flex-end'>
                <Button variant='outlined' color='secondary' onClick={onClose}>
                  Cancel
                </Button>
                {user.builderStatus === 'applied' && (
                  <Button
                    disabled={!githubLoginDisplayed}
                    loading={isExecutingUpdate}
                    color='error'
                    variant='outlined'
                    onClick={rejectBuilder}
                  >
                    Reject
                  </Button>
                )}
                {user.builderStatus === 'rejected' && (
                  <Button
                    disabled={!githubLoginDisplayed}
                    loading={isExecutingUpdate}
                    variant='outlined'
                    onClick={reapplyBuilder}
                  >
                    Reapply
                  </Button>
                )}
                <Tooltip
                  title={
                    cannotUnsuspend
                      ? 'Builder has been suspended for 3 strikes'
                      : 'Provide a Github login to set up a builder profile'
                  }
                >
                  <span>
                    <Button
                      disabled={!githubLoginDisplayed || cannotUnsuspend}
                      loading={isCreating}
                      type='submit'
                      color='primary'
                      variant='contained'
                    >
                      {user.builderStatus === 'banned' ? 'Unsuspend' : 'Approve'}
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </form>
    </Dialog>
  );
}
