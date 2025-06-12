'use client';

import { DeleteOutline, Refresh as RefreshIcon } from '@mui/icons-material';
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
  Typography
} from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { useDeleteGithubUserStrike } from 'hooks/api/github';
import { revalidateNewsPathAction } from 'lib/actions/revalidateNewsPathAction';
import type { NewsItem } from 'lib/news/getNews';
import { setBuilderStatusAction } from 'lib/users/updateUserAction';

export function NewsDashboard({ news: initialNews }: { news: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);

  const { trigger: deleteGithubUserStrike } = useDeleteGithubUserStrike();
  const { execute: setBuilderStatus } = useAction(setBuilderStatusAction);

  const handleClearStrike = async (strikeId: string) => {
    await deleteGithubUserStrike({ strikeId });
    setNews((prev) => prev.filter((item) => item.id !== strikeId));
    revalidateNewsPathAction();
  };

  const handleReinstateBuilder = async (builderId: string) => {
    await setBuilderStatus({ userId: builderId, status: 'approved' });
    setNews((prev) => prev.filter((item) => item.builder.id !== builderId));
    revalidateNewsPathAction();
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
                    {item.builder.displayName}
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
                      onClick={() => handleClearStrike(item.id)}
                    />
                    {item.builder.builderStatus === 'banned' && (
                      <RefreshIcon
                        color='success'
                        sx={{ cursor: 'pointer' }}
                        fontSize='small'
                        onClick={() => handleReinstateBuilder(item.builder.id)}
                      />
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
