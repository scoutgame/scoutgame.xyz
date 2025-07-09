'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';

type RepoItem = {
  id: number;
  fullName: string;
  url: string;
};

type GroupedRepos = Record<string, RepoItem[]>;

type Props = {
  title: string;
  repos: RepoItem[];
  emptyMessage: string;
  orgActionIcon: React.ReactNode;
  orgActionColor: 'primary' | 'error';
  orgActionLabel: string;
  repoActionLabel: string;
  onOrgAction: (org: string, orgRepos: RepoItem[]) => void;
  onRepoAction: (repo: RepoItem) => void;
  maxHeight?: number;
};

export function RepoOrgSection({
  title,
  repos,
  emptyMessage,
  orgActionIcon,
  orgActionColor,
  orgActionLabel,
  repoActionLabel,
  onOrgAction,
  onRepoAction,
  maxHeight = 300
}: Props) {
  // Group repos by organization
  const groupedRepos: GroupedRepos = repos.reduce((acc, repo) => {
    const org = repo.fullName.split('/')[0];
    if (!acc[org]) {
      acc[org] = [];
    }
    acc[org].push(repo);
    return acc;
  }, {} as GroupedRepos);

  const containerStyles = {
    maxHeight,
    overflow: 'auto',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    bgcolor: 'background.paper'
  };

  return (
    <Box sx={{ mb: 2 }}>
      {title && (
        <Typography variant='body2' color='textSecondary' gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={containerStyles}>
        {repos.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='textSecondary' sx={{ fontStyle: 'italic' }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedRepos).map(([org, orgRepos], index) => (
            <Box key={org}>
              {index > 0 && <Divider sx={{ my: 0.5 }} />}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 48,
                    '&.Mui-expanded': {
                      minHeight: 48
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                      '&.Mui-expanded': {
                        margin: '12px 0'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                    <IconButton
                      size='small'
                      color={orgActionColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrgAction(org, orgRepos);
                      }}
                      sx={{ mr: 1 }}
                      title={`${orgActionLabel} all repositories from ${org}`}
                    >
                      {orgActionIcon}
                    </IconButton>
                    <Link
                      href={`https://github.com/${org}`}
                      target='_blank'
                      variant='subtitle2'
                      sx={{
                        fontWeight: 'medium',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {org} ({orgRepos.length} repositor{orgRepos.length === 1 ? 'y' : 'ies'})
                    </Link>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={1}>
                    {orgRepos.map((repo) => (
                      <Box
                        key={repo.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Link
                            href={repo.url}
                            target='_blank'
                            variant='body2'
                            sx={{ fontWeight: 'medium', textDecoration: 'none' }}
                          >
                            {repo.fullName}
                          </Link>
                        </Box>
                        <Button
                          size='small'
                          variant='outlined'
                          color={orgActionColor}
                          onClick={() => onRepoAction(repo)}
                          title={`${repoActionLabel} ${repo.fullName}`}
                        >
                          {repoActionLabel}
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
