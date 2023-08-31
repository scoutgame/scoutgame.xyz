import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { useState } from 'react';

import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { IPropertyTemplate, Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import type { ProposalFields, ProposalFieldsProp } from 'lib/proposal/blocks/interfaces';
import { isTruthy } from 'lib/utilities/types';

export type BoardProposal = { spaceId?: string; id?: string } & ProposalFieldsProp;

export function useProposalsBoardAdapter() {
  const [boardProposal, setBoardProposal] = useState<BoardProposal | null>(null);
  const { space } = useCurrentSpace();
  const { proposals } = useProposals();
  const { categories } = useProposalCategories();
  const { pages } = usePages();
  const { proposalPropertiesBlock } = useProposalBlocks();
  const proposalPage = pages[boardProposal?.id || ''];
  const customProperties = (proposalPropertiesBlock?.fields?.properties || []) as IPropertyTemplate[];

  const cardPages: CardPage[] =
    proposals
      ?.map((p: any) => {
        const page = pages[p?.id];

        return mapProposalToCardPage({ proposal: p, proposalPage: page, spaceId: space?.id });
      })
      .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

  // board with all proposal properties and default properties
  const board: Board = getDefaultBoard({
    properties: customProperties,
    categories
  });

  const boardCustomProperties: Board = getDefaultBoard({
    properties: customProperties,
    customOnly: true,
    categories: []
  });

  // card from current proposal
  const card: Card = mapProposalToCardPage({ proposal: boardProposal, proposalPage, spaceId: space?.id }).card;

  // each proposal with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card) || [];

  // mock properties needed to display focalboard view
  const activeView = getDefaultTableView({ properties: customProperties, categories });

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    card,
    cards,
    cardPages,
    activeView,
    views,
    proposalPage,
    boardProposal,
    setBoardProposal
  };
}

// build mock card from proposal and page data
function mapProposalToCardPage({
  proposal,
  proposalPage,
  spaceId
}: {
  proposal: BoardProposal | ProposalWithUsers | null;
  proposalPage?: PageMeta;
  spaceId?: string;
}) {
  const proposalFields = (proposal?.fields || { properties: {} }) as ProposalFields;
  const proposalSpaceId = proposal?.spaceId || spaceId || '';

  proposalFields.properties = {
    ...proposalFields.properties,
    // add default field values on the fly
    __category: (proposal && 'categoryId' in proposal && proposal.categoryId) || '',
    __status: (proposal && 'status' in proposal && proposal.status) || '',
    __evaluationType: (proposal && 'evaluationType' in proposal && proposal.evaluationType) || '',
    __authors: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    __reviewers:
      (proposal && 'reviewers' in proposal && proposal.reviewers?.map((r) => r.userId).filter(isTruthy)) || ''
  };

  const card: Card = {
    id: proposal?.id || '',
    spaceId: proposalSpaceId,
    parentId: '',
    schema: 1,
    title: proposalPage?.title || '',
    rootId: proposalSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: proposalPage?.updatedBy || '',
    createdBy: proposalPage?.createdBy || '',
    createdAt: proposalPage?.createdAt ? new Date(proposalPage?.createdAt).getTime() : 0,
    updatedAt: proposalPage?.updatedAt ? new Date(proposalPage?.updatedAt).getTime() : 0,
    deletedAt: null,
    fields: { ...proposalFields, contentOrder: [] }
  };

  return { card, page: proposalPage };
}
