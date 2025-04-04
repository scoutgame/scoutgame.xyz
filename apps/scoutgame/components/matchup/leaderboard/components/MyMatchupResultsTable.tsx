import { log } from '@charmverse/core/log';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  List,
  ListItem,
  ListItemText,
  Stack,
  TableContainer,
  Typography
} from '@mui/material';
import { getMyMatchupResults } from '@packages/matchup/getMyMatchupResults';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Link from 'next/link';

export async function MyMatchupResultsTable({ week, scoutId }: { week: string; scoutId?: string }) {
  const [error, matchup] = await safeAwaitSSRData(getMyMatchupResults({ week, scoutId }));
  if (error || !matchup) {
    if (error) {
      log.error('error getting user matchup results', { userId: scoutId, error });
    }
    return null;
  }
  return (
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
        <Typography color='text.secondary'>{matchup?.scout.displayName}'s Team</Typography>
        <Box display='flex' alignItems='center' gap={0.5}>
          <Typography>{matchup.totalGemsCollected}</Typography>
          <GemsIcon />
        </Box>
      </Box>

      <TableContainer
        className='contained-table'
        sx={{
          '.MuiTableCell-root': {
            px: 1
          }
        }}
      >
        {matchup.developers.map((developer, index) => (
          <Accordion
            key={developer.id}
            sx={{
              mb: 1,
              background: 'none',
              boxShadow: 'none',
              '&::before': {
                display: 'none'
              },
              '& .MuiAccordionSummary-root': {
                background: 'var(--mui-palette-background-paper)',
                borderRadius: 1
              },
              '& .MuiAccordionDetails-root': {
                px: 0
              },
              '& .MuiListItem-root': {
                background: 'var(--mui-palette-background-paper)',
                mb: 0.5,
                mx: 0,
                px: 2,
                borderRadius: 1
              }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '.MuiAccordionSummary-content': { margin: 0 } }}>
              <Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='body2'>{index + 1}.</Typography>
                  <Avatar
                    src={developer.avatar}
                    name={developer.displayName}
                    size='small'
                    sx={{ display: 'inline-flex' }}
                  />
                  <Typography variant='body2'>{developer.displayName}</Typography>
                </Box>
                <Stack direction='row' spacing={0.5} alignItems='center' mr={2}>
                  <Typography variant='body2'>{developer.totalGemsCollected}</Typography>
                  <GemsIcon />
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {developer.events && developer.events.length > 0 ? (
                <List dense disablePadding>
                  {developer.events.map((event) => (
                    <ListItem key={event.url} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box display='flex' justifyContent='space-between'>
                            <Typography variant='body2' flexGrow={1}>
                              <Link href={event.url} target='_blank'>
                                {event.contributionType}
                              </Link>
                            </Typography>
                            <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end'>
                              <Typography variant='body2'>{event.gemsCollected}</Typography>
                              <GemsIcon size={14} />
                            </Stack>
                            <Typography variant='body2' sx={{ minWidth: 30, textAlign: 'right' }}>
                              {event.createdAt}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant='caption' color='grey'>
                            {event.repoFullName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant='body2' color='text.secondary' align='center'>
                  No events recorded
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </TableContainer>
    </>
  );
}
