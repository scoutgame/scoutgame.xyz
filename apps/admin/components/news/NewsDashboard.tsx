'use client';

import { DeleteOutline } from '@mui/icons-material';
import {
  Avatar,
  Container,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { useState } from 'react';

import { useDeleteGithubUserStrike } from 'hooks/api/github';
import { revalidateNewsPathAction } from 'lib/actions/revalidateNewsPathAction';
import type { NewsItem } from 'lib/news/getNews';

export function NewsDashboard({ news: initialNews }: { news: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [strikeToDelete, setStrikeToDelete] = useState<{
    id: string;
    strikeCount: number;
    builderStatus: string;
  } | null>(null);

  const { trigger: deleteGithubUserStrike } = useDeleteGithubUserStrike();

  const handleClearStrike = async (strikeId: string) => {
    await deleteGithubUserStrike({ strikeId });
    setNews((prev) => prev.filter((item) => item.id !== strikeId));
    revalidateNewsPathAction();
    setStrikeToDelete(null);
  };

  const handleDeleteClick = (item: NewsItem) => {
    if (item.builder.builderStatus === 'banned' && item.strikeCount <= 3) {
      setStrikeToDelete({
        id: item.id,
        strikeCount: item.strikeCount,
        builderStatus: item.builder.builderStatus
      });
    } else {
      handleClearStrike(item.id);
    }
  };

  return (
    <Container maxWidth='xl'>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Builder</TableCell>
              <TableCell align='center'>Strike Time</TableCell>
              <TableCell align='center'>Pull Request</TableCell>
              <TableCell align='center'>Total Strikes</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {news.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    target='_blank'
                    href={`https://scoutgame.xyz/u/${item.builder.path}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <Avatar src={item.builder.avatar || undefined} sx={{ width: 36, height: 36 }} />
                    <Typography color={item.builder.builderStatus === 'banned' ? 'error' : 'inherit'}>
                      {item.builder.displayName}
                    </Typography>
                  </Link>
                </TableCell>
                <TableCell align='center'>{new Date(item.createdAt).toLocaleString()}</TableCell>
                <TableCell align='left'>
                  {item.githubEvent ? (
                    <Link href={item.githubEvent.url} target='_blank'>
                      <Typography color='primary' display='block'>
                        {item.githubEvent.title}
                      </Typography>
                      <Typography variant='caption' color='secondary' display='block'>
                        {item.githubEvent.repo.owner}/{item.githubEvent.repo.name}
                      </Typography>
                    </Link>
                  ) : (
                    <Typography variant='caption' color='secondary'>
                      No PR details available
                    </Typography>
                  )}
                </TableCell>
                <TableCell align='center'>
                  <Typography
                    color={item.strikeCount > 0 ? 'error' : 'inherit'}
                    fontWeight={item.strikeCount > 0 ? 'bold' : 'normal'}
                  >
                    {item.strikeCount}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <DeleteOutline
                      color='error'
                      sx={{
                        cursor: 'pointer'
                      }}
                      fontSize='small'
                      onClick={() => handleDeleteClick(item)}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!strikeToDelete} onClose={() => setStrikeToDelete(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Warning: Builder Will Be Unbanned</DialogTitle>
        <DialogContent>
          <Typography>
            Removing this strike will reduce the total strikes to{' '}
            {strikeToDelete?.strikeCount ? strikeToDelete.strikeCount - 1 : 0}, which will automatically unban this
            builder and change their status to 'approved'. Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStrikeToDelete(null)} color='inherit'>
            Cancel
          </Button>
          <Button
            onClick={() => strikeToDelete && handleClearStrike(strikeToDelete.id)}
            color='error'
            variant='contained'
          >
            Remove Strike & Unban
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
