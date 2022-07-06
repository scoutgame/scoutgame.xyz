import { Box, Stack, Typography } from '@mui/material';
import useSWR from 'swr';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Vote } from '@prisma/client';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { PagesMap } from 'hooks/usePages';
import Database from 'components/common/Database';
import { createBoard, IPropertyOption } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { createBoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { Card, createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { IPageWithPermissions } from 'lib/pages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';

export default function VotesPage () {

  const [currentSpace] = useCurrentSpace();
  const { data } = useSWR(() => `votesBySpace/${currentSpace?.id}`, () => currentSpace ? charmClient.getVotesBySpace(currentSpace.id) : []);

  const { board, views } = getPageModels();

  const pages: PagesMap = {};

  const cards = (data ?? []).reduce<Record<string, Card>>((voteMap, vote) => {

    const { card, page } = getVoteModels(vote);

    card.parentId = board.id;
    card.rootId = board.rootId;

    views.forEach(view => {
      view.fields.cardOrder.push(card.id);
    });

    voteMap[card.id] = card;
    pages[card.id] = page;

    return voteMap;
  }, {});

  return (
    <CenteredPageContent>
      <Stack direction='row' alignItems='center' gap={1} mb={1}>
        <VoteIcon fontSize='large' />
        <Typography variant='h1'>
          <strong>Votes</strong>
        </Typography>
      </Stack>
      <Database
        board={board}
        cards={cards}
        pages={pages}
        views={views}
      />
    </CenteredPageContent>
  );
}

function getPageModels () {

  const board = createBoard({ addDefaultProperty: true });

  const statusOptions: IPropertyOption[] = [
    { id: 'InProgress', value: 'In Progress', color: 'propColorYellow' },
    { id: 'Passed', value: 'Passed', color: 'propColorTeal' },
    { id: 'Rejected', value: 'Rejected', color: 'propColorRed' },
    { id: 'Cancelled', value: 'Cancelled', color: 'propColorGray' }
  ];

  board.fields.cardProperties = [
    { id: 'title', name: 'Title', type: 'text', options: [] },
    { id: 'created', name: 'Created', type: 'date', options: [] },
    { id: 'deadline', name: 'Deadline', type: 'date', options: [] },
    { id: 'status', name: 'Status', type: 'select', options: statusOptions }
  ];

  const tableView = createBoardView();
  tableView.fields.columnWidths = {
    __title: 400,
    created: 150,
    deadline: 150,
    status: 150
  };
  tableView.id = 'table';
  tableView.fields.visiblePropertyIds = ['created', 'deadline', 'status'];
  tableView.fields.viewType = 'table';
  tableView.title = 'Table';
  tableView.parentId = board.id;
  tableView.rootId = board.rootId;

  const boardView = createBoardView();
  boardView.fields.columnWidths = {
    created: 150,
    deadline: 150,
    status: 150,
    __title: 500
  };
  boardView.id = 'board';
  boardView.fields.visiblePropertyIds = ['created', 'deadline'];
  boardView.fields.viewType = 'board';
  boardView.fields.groupById = 'status';
  boardView.title = 'Columns';
  boardView.parentId = board.id;
  boardView.rootId = board.rootId;

  const views = [tableView, boardView];

  return { board, views };
}

// translate vote model to focalboard models

function getVoteModels (vote: Vote) {
  const card = createCard();
  card.title = vote.title;
  card.fields.properties.deadline = new Date(vote.deadline).getTime().toString();
  card.fields.properties.created = new Date(vote.createdAt).getTime().toString();
  card.fields.properties.status = vote.status;
  card.fields.contentOrder = [];
  const page: IPageWithPermissions = {
    autoGenerated: false,
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    index: -1,
    path: '',
    spaceId: '',
    parentId: null,
    type: 'page',
    boardId: null,
    snapshotProposalId: null,
    cardId: card.id,
    fullWidth: false,
    createdAt: vote.createdAt,
    createdBy: vote.createdBy,
    updatedAt: vote.createdAt,
    updatedBy: vote.createdBy,
    permissions: [],
    id: card.id,
    deletedAt: null,
    title: vote.title
  };
  return { card, page };
}
