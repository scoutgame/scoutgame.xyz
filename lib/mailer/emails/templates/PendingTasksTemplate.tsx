import type { User } from '@charmverse/core/prisma';
import { DateTime } from 'luxon';
import { MjmlColumn, MjmlDivider, MjmlSection, MjmlText } from 'mjml-react';

import { BOUNTY_STATUS_COLORS, BOUNTY_STATUS_LABELS } from 'components/bounties/components/BountyStatusBadge';
import { ProposalStatusColors } from 'components/proposals/components/ProposalStatusBadge';
import { baseUrl } from 'config/constants';
import type {
  BountyNotification,
  ForumNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { DiscussionNotification } from 'lib/notifications/interfaces';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { colors, greyColor2 } from 'theme/colors';

import { EmailWrapper, Feedback, Footer, Header } from './components';

const MAX_ITEMS_PER_TASK = 3;
const MAX_CHAR = 60;
type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
export const buttonStyle = {
  color: '#ffffff',
  lineHeight: '120%',
  textDecoration: 'none',
  borderRadius: '3px',
  fontWeight: '600',
  padding: '10px 30px',
  background: '#009Fb7'
};
const h2Style = { lineHeight: '1.2em', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' };
const h3Style = { lineHeight: '1em', fontSize: '20px', fontWeight: 'bold', marginTop: '8px', marginBottom: '5px' };

export interface PendingNotifications {
  discussionNotifications: DiscussionNotification[];
  totalNotifications: number;
  voteNotifications: VoteNotification[];
  proposalNotifications: ProposalNotification[];
  bountyNotifications: BountyNotification[];
  forumNotifications: ForumNotification[];
  // eslint-disable-next-line
  user: TemplateUser;
}

function ViewAllText({ href }: { href: string }) {
  return (
    <MjmlText>
      <a href={href}>
        <h4 style={{ marginBottom: 0 }}>View all</h4>
      </a>
    </MjmlText>
  );
}

export default function PendingNotifications(props: PendingNotifications) {
  const totalDiscussionNotifications = props.discussionNotifications.length;
  const totalVoteNotifications = props.voteNotifications.length;
  const totalProposalNotifications = props.proposalNotifications.length;
  const totalBountyNotifications = props.bountyNotifications.length;
  const totalForumNotifications = props.forumNotifications.length;

  const nexusDiscussionLink = `${baseUrl}/?notifications=discussion`;
  const nexusVoteLink = `${baseUrl}/?notifications=vote`;
  const nexusProposalLink = `${baseUrl}/?notifications=proposal`;
  const nexusBountyLink = `${baseUrl}/?notifications=bounty`;
  const nexusForumLink = `${baseUrl}/?notifications=forum`;

  const discussionSection =
    totalDiscussionNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusDiscussionLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalDiscussionNotifications} Page Comment{totalDiscussionNotifications > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusDiscussionLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.discussionNotifications.slice(0, MAX_ITEMS_PER_TASK).map((discussionTask) => (
          <DiscussionNotification key={discussionTask.taskId} task={discussionTask} />
        ))}
        {totalDiscussionNotifications > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusDiscussionLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const proposalSection =
    totalProposalNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusProposalLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalProposalNotifications} Proposal{totalProposalNotifications > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusProposalLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.proposalNotifications.slice(0, MAX_ITEMS_PER_TASK).map((proposalTask) => (
          <ProposalTaskMjml key={proposalTask.taskId} task={proposalTask} />
        ))}
        {totalProposalNotifications > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusProposalLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const bountySection =
    totalBountyNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusBountyLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalBountyNotifications} Bount{totalBountyNotifications > 1 ? 'ies' : 'y'}
              </span>
            </a>
            <a href={nexusBountyLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.bountyNotifications.slice(0, MAX_ITEMS_PER_TASK).map((proposalTask) => (
          <BountyTaskMjml key={proposalTask.taskId} task={proposalTask} />
        ))}
        {totalBountyNotifications > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusProposalLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const voteSection =
    totalVoteNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusVoteLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalVoteNotifications} Poll{totalVoteNotifications > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusVoteLink} style={buttonStyle}>
              Vote now
            </a>
          </div>
        </MjmlText>
        {props.voteNotifications.slice(0, MAX_ITEMS_PER_TASK).map((voteTask) => (
          <VoteTaskMjml key={voteTask.taskId} task={voteTask} />
        ))}
        {totalVoteNotifications > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusVoteLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const forumSection =
    totalForumNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusForumLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalForumNotifications} Forum Event{totalForumNotifications > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusForumLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.forumNotifications.slice(0, MAX_ITEMS_PER_TASK).map((forumTask) => (
          <ForumTask key={forumTask.taskId} task={forumTask} />
        ))}
        {totalForumNotifications > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusForumLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  return (
    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>{tasksRequiresYourAttention({ count: props.totalNotifications })}.</h3>
          </MjmlText>
          {proposalSection}
          {voteSection}
          {bountySection}
          {discussionSection}
          {forumSection}
        </MjmlColumn>
      </MjmlSection>
      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteTaskMjml({ task }: { task: VoteNotification }) {
  const pageWorkspaceTitle = `${task.pageTitle} | ${task.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${task.spaceDomain}/${task.pagePath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {task.title.length > MAX_CHAR ? `${task.title.slice(0, MAX_CHAR)}...` : task.title}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
      <div
        style={{
          color: colors.red.dark,
          fontSize: 14,
          fontWeight: 'bold'
        }}
      >
        Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: DateTime.now() })}
      </div>
    </MjmlText>
  );
}

function ProposalTaskMjml({ task }: { task: ProposalNotification }) {
  const pageWorkspaceTitle = `${task.pageTitle || 'Untitled'} | ${task.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${task.spaceDomain}/${task.pagePath}`}
        style={{
          display: 'block',
          color: 'inherit'
        }}
      >
        <div style={{ ...h2Style, fontSize: '18px', fontWeight: 'bold', marginBottom: 10 }}>{pageWorkspaceTitle}</div>
      </a>

      <div
        style={{
          fontSize: '0.75rem',
          width: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          borderRadius: '16px',
          backgroundColor: colors[ProposalStatusColors[task.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{PROPOSAL_STATUS_LABELS[task.status]}</span>
      </div>
    </MjmlText>
  );
}

function BountyTaskMjml({ task }: { task: BountyNotification }) {
  const pageWorkspaceTitle = `${task.pageTitle || 'Untitled'} | ${task.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${task.spaceDomain}/${task.pagePath}`}
        style={{
          color: 'inherit',
          display: 'block'
        }}
      >
        <div style={{ ...h2Style, fontSize: '18px', fontWeight: 'bold', marginBottom: 10 }}>{pageWorkspaceTitle}</div>
      </a>

      <div
        style={{
          fontSize: '0.75rem',
          width: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          borderRadius: '16px',
          backgroundColor: colors[BOUNTY_STATUS_COLORS[task.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{BOUNTY_STATUS_LABELS[task.status]}</span>
      </div>
    </MjmlText>
  );
}

function DiscussionNotification({
  task: { text, spaceName, pageTitle, pagePath, spaceDomain }
}: {
  task: DiscussionNotification;
}) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${spaceDomain}/${pagePath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {text.length > MAX_CHAR ? `${text.slice(0, MAX_CHAR)}...` : text}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

function ForumTask({ task: { spaceName, spaceDomain, postPath, postTitle } }: { task: ForumNotification }) {
  const pageWorkspaceTitle = `${postTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${spaceDomain}/forum/post/${postPath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {postTitle}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

export function tasksRequiresYourAttention({ count, includeName }: { count: number; includeName?: boolean }) {
  return `${count} ${includeName ? 'CharmVerse ' : ''}task${count > 1 ? 's' : ''} need${
    count > 1 ? '' : 's'
  } your attention`;
}
