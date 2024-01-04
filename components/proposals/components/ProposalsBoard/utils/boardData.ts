import type { ProposalEvaluationResult } from '@charmverse/core/dist/cjs/prisma-client';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import { Constants } from 'lib/focalboard/constants';
import {
  PROPOSAL_RESULT_LABELS,
  PROPOSAL_STEP_LABELS,
  proposalDbProperties,
  proposalResultBoardColors,
  proposalStepBoardColors
} from 'lib/focalboard/proposalDbProperties';
import { createTableView } from 'lib/focalboard/tableView';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID
} from 'lib/proposal/blocks/constants';
import type { ProposalBoardBlock } from 'lib/proposal/blocks/interfaces';
import type { ProposalEvaluationResultExtended, ProposalEvaluationStep } from 'lib/proposal/interface';

const proposalResults = Object.keys(PROPOSAL_RESULT_LABELS) as ProposalEvaluationResultExtended[];
const proposalSteps = Object.keys(PROPOSAL_STEP_LABELS) as ProposalEvaluationStep[];

export function getDefaultBoard({
  storedBoard,
  customOnly = false
}: {
  storedBoard: ProposalBoardBlock | undefined;
  customOnly?: boolean;
}) {
  const block: Partial<Block> = storedBoard
    ? blockToFBBlock(storedBoard)
    : createBoard({
        block: {
          id: DEFAULT_BOARD_BLOCK_ID,
          fields: {
            cardProperties: []
          }
        }
      });

  const cardProperties = [...getDefaultProperties(), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

function getDefaultProperties() {
  return [
    proposalDbProperties.proposalCreatedAt(CREATED_AT_ID),
    getDefaultStatusProperty(),
    getDefaultStepProperty(),
    proposalDbProperties.proposalAuthor(AUTHORS_BLOCK_ID, 'Author'),
    proposalDbProperties.proposalReviewer(PROPOSAL_REVIEWERS_BLOCK_ID, 'Reviewers')
  ];
}

export function getDefaultStatusProperty() {
  return {
    ...proposalDbProperties.proposalStatus(PROPOSAL_STATUS_BLOCK_ID, 'Status'),
    options: proposalResults.map((s) => ({
      id: s,
      value: s,
      color: proposalResultBoardColors[s]
    }))
  };
}

export function getDefaultStepProperty() {
  return {
    ...proposalDbProperties.proposalStep(PROPOSAL_STEP_BLOCK_ID, 'Step'),
    options: proposalSteps.map((s) => ({
      id: s,
      value: PROPOSAL_STEP_LABELS[s],
      color: proposalStepBoardColors[s]
    }))
  };
}

export function getDefaultTableView({ storedBoard }: { storedBoard: ProposalBoardBlock | undefined }) {
  const view = createTableView({
    board: getDefaultBoard({ storedBoard })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [Constants.titleColumnId]: 400,
    [PROPOSAL_STATUS_BLOCK_ID]: 150,
    [PROPOSAL_STEP_BLOCK_ID]: 150,
    [AUTHORS_BLOCK_ID]: 150,
    [PROPOSAL_REVIEWERS_BLOCK_ID]: 150
  };

  // Default sorty by latest entries
  view.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];

  // Hide createdAt by default
  view.fields.visiblePropertyIds = view.fields.visiblePropertyIds
    ? view.fields.visiblePropertyIds.filter((id) => id !== CREATED_AT_ID)
    : [];

  view.fields.openPageIn = 'full_page';

  return view;
}
