
import { Stack, Typography, IconButton, Collapse, Tabs, Tab, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import { ReactNode, useState } from 'react';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';
import { UserCommunity } from 'lib/profile/interfaces';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Avatar from 'components/common/Avatar';
import type { CredentialsResult } from 'lib/collabland';
import { ProfileItemContainer } from './ProfileItemRow';

const TASK_TABS = [
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <ForumIcon />, label: 'Proposals', type: 'proposal' },
  { icon: <BountyIcon />, label: 'Bounties', type: 'bounty' }
] as const;

export type CommunityDetails = UserCommunity & {
  proposals: DeepDaoProposal[];
  votes: DeepDaoVote[];
  bounties: CredentialsResult['bountyEvents'];
  joinDate: string;
  latestEventDate?: string;
}

interface CommunityRowProps {
  community: CommunityDetails;
  showVisibilityIcon: boolean;
  visible: boolean;
  onClick: () => void;
}

function CountIcon ({ label, icon, count }: { label: string, icon: ReactNode, count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <Tooltip title={label}>
      <Typography variant='subtitle2' sx={{ pr: 1, gap: 0.5, display: 'inline-flex', alignItems: 'center' }}>
        <Box mt={0.5} sx={{ svg: { fontSize: '16px' } }}>{icon}</Box> {count}
      </Typography>
    </Tooltip>
  );
}

function TaskTab ({ task, onClick }: { task: typeof TASK_TABS[number], onClick: () => void }) {

  return (
    <Tab
      iconPosition='start'
      icon={task.icon}
      key={task.label}
      sx={{
        px: 1.5,
        fontSize: 14,
        minHeight: 0,
        '&.MuiTab-root': {
          color: 'palette.secondary.main'
        }
      }}
      label={task.label}
      value={task.type}
      onClick={onClick}
    />
  );
}

interface EventRowProps {
  eventNumber: number;
  icon: ReactNode;
  title: string;
  createdAt: string;
}

function EventRow (event: EventRowProps) {

  return (
    <Stack flexDirection='row' gap={1}>
      <Stack
        flexDirection='row'
        gap={1}
        alignItems='center'
        alignSelf='flex-start'
      >
        {event.icon}
        <Typography fontWeight={500}>{event.eventNumber}.</Typography>
      </Stack>
      <Stack
        gap={0.5}
        sx={{
          flexGrow: 1,
          flexDirection: {
            sm: 'column',
            md: 'row'
          },
          alignItems: 'flex-start'
        }}
      >
        <Typography sx={{ flexGrow: 1 }}>
          {event.title}
        </Typography>
        <Typography variant='subtitle1' color='secondary' textAlign={{ sm: 'left', md: 'right' }} minWidth={100}>{showDateWithMonthAndYear(event.createdAt, true)}</Typography>
      </Stack>
    </Stack>
  );
}

function VotesPanel ({ events }: { events: DeepDaoVote[] }) {

  return (
    <>
      {
        events
          .sort((eventA, eventB) => eventA.createdAt > eventB.createdAt ? -1 : 1)
          .map((event, index) => (
            <EventRow
              key={event.voteId}
              createdAt={event.createdAt}
              title={event.title}
              icon={event.successful
                ? <ThumbUpIcon color='success' sx={{ fontSize: '16px' }} />
                : <ThumbDownIcon color='error' sx={{ fontSize: '16px' }} />}
              eventNumber={index + 1}
            />
          ))
      }
    </>
  );
}

function ProposalsPanel ({ events }: { events: DeepDaoProposal[] }) {

  return (
    <>
      {
        events.sort((eventA, eventB) => eventA.createdAt > eventB.createdAt ? -1 : 1)
          .map((event, index) => (
            <EventRow
              key={event.proposalId}
              createdAt={event.createdAt}
              title={event.title}
              icon={event.outcome === event.voteChoice
                ? <ThumbUpIcon color='success' sx={{ fontSize: '16px' }} />
                : <ThumbDownIcon color='error' sx={{ fontSize: '16px' }} />}
              eventNumber={index + 1}
            />
          ))
        }
    </>
  );
}

function BountyEventsPanel ({ events }: { events: CredentialsResult['bountyEvents'] }) {

  return (
    <>
      {
        events.sort((eventA, eventB) => eventA.createdAt > eventB.createdAt ? -1 : 1)
          .map((event, index) => (
            <EventRow
              key={event.subject.bountyId}
              createdAt={event.createdAt}
              title={event.subject.bountyTitle}
              icon={null}
              eventNumber={index + 1}
            />
          ))
        }
    </>
  );
}

export default function CommunityRow ({ community, showVisibilityIcon, visible, onClick }: CommunityRowProps) {

  const hasVotes = community.votes.length > 0;
  const hasProposals = community.proposals.length > 0;
  const hasBounties = community.bounties.length > 0;
  const isCollapsible = hasVotes || hasProposals || hasBounties;
  const defaultTab = hasVotes ? 'vote' : hasProposals ? 'proposal' : hasBounties ? 'bounty' : null;

  const [currentTab, setCurrentTab] = useState<typeof TASK_TABS[number]['type']>(defaultTab || 'vote');
  const [isCollapsed, setIsCollapsed] = useState(true);

  function toggleCollapse () {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  }

  return (
    <ProfileItemContainer visible={visible}>
      <Box
        display='flex'
        gap={2}
        flexDirection='row'
        alignItems='center'
        onClick={toggleCollapse}
      >
        <Avatar
          avatar={community.logo}
          name={community.name}
          variant='rounded'
          size='large'
        />
        <Box
          align-items='center'
          display='flex'
          justifyContent='space-between'
          flexGrow={1}
        >
          <Box>
            <Typography
              sx={{
                fontSize: {
                  sm: '1.15rem',
                  xs: '1.05rem'
                }
              }}
              fontWeight={500}
            >
              {community.name}
            </Typography>
            {community.joinDate && (
              <Typography variant='subtitle2'>
                {showDateWithMonthAndYear(community.joinDate)} - {community.latestEventDate ? showDateWithMonthAndYear(community.latestEventDate) : 'Present'}
              </Typography>
            )}
            <CountIcon icon={<HowToVoteIcon />} label='Votes' count={community.votes.length} />
            <CountIcon icon={<ForumIcon />} label='Proposals' count={community.proposals.length} />
            <CountIcon icon={<BountyIcon />} label='Bounties' count={community.bounties.length} />
          </Box>
          <Box display='flex' alignItems='center' gap={0.5}>
            {showVisibilityIcon && (
              <Tooltip title={`${visible ? 'Hide' : 'Show'} Community from profile`}>
                <IconButton
                  className='action'
                  size='small'
                  onClick={(e) => {
                    // Don't want visibility icon to toggle the proposal and votes list
                    e.stopPropagation();
                    onClick();
                  }}
                  sx={{
                    opacity: {
                      md: 0,
                      sm: 1
                    }
                  }}
                >
                  {visible ? (
                    <VisibilityIcon fontSize='small' />
                  ) : (
                    <VisibilityOffIcon fontSize='small' />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {isCollapsible && (
              <IconButton size='small'>
                {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={!isCollapsed}>
        <Box>
          <Tabs
            sx={{
              mb: 2
            }}
            indicatorColor='primary'
            value={currentTab}
          >
            {hasVotes && <TaskTab task={TASK_TABS[0]} onClick={() => setCurrentTab(TASK_TABS[0].type)} />}
            {hasProposals && <TaskTab task={TASK_TABS[1]} onClick={() => setCurrentTab(TASK_TABS[1].type)} />}
            {hasBounties && <TaskTab task={TASK_TABS[2]} onClick={() => setCurrentTab(TASK_TABS[2].type)} />}
          </Tabs>
          <Stack gap={2}>
            {currentTab === 'vote' && <VotesPanel events={community.votes} />}
            {currentTab === 'proposal' && <ProposalsPanel events={community.proposals} />}
            {currentTab === 'bounty' && <BountyEventsPanel events={community.bounties} />}
          </Stack>
        </Box>
      </Collapse>
    </ProfileItemContainer>
  );
}
