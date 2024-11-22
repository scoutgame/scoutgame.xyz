import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import type { BoardView, BoardViewFields } from '@root/lib/databases/boardView';
import type { Card } from '@root/lib/databases/card';
import type { ProposalBoardBlock } from '@root/lib/proposals/blocks/interfaces';
import { formatDate, formatDateTime } from '@root/lib/utils/dates';
import { stringify } from 'csv-stringify/sync';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { OctoUtils } from 'components/common/DatabaseEditor/octoUtils';
import { sortCards } from 'components/common/DatabaseEditor/store/cards';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { mapProposalToCard } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { CardFilter } from 'lib/databases/cardFilter';
import { Constants } from 'lib/databases/constants';
import { PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { PROPOSAL_EVALUATION_TYPE_ID } from 'lib/proposals/blocks/constants';
import { getProposals } from 'lib/proposals/getProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(exportProposals);

async function exportProposals(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user?.id;
  const space = await prisma.space.findUniqueOrThrow({ where: { id: spaceId }, select: { domain: true } });

  // Get board and view blocks
  const [proposalViewBlock, proposalBoardBlock] = await Promise.all([
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: '__defaultView',
          spaceId
        }
      }
    }),
    prisma.proposalBlock.findFirst({
      where: {
        spaceId,
        type: '__defaultBoard'
      }
    })
  ]);

  // Get accessible proposals and space members
  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    userId,
    spaceId
  });

  const [proposals, spaceMembers] = await Promise.all([
    getProposals({ ids, spaceId, userId }),
    prisma.user.findMany({
      where: {
        spaceRoles: {
          some: {
            spaceId
          }
        }
      },
      select: {
        id: true,
        username: true
      }
    })
  ]);

  // Create members record for display values
  const membersRecord = spaceMembers.reduce<Record<string, { username: string }>>((acc, user) => {
    acc[user.id] = { username: user.username };
    return acc;
  }, {});

  // Get evaluation step titles for board configuration
  const evaluationStepTitles = new Set<string>();
  proposals.forEach((p) => {
    p.evaluations.forEach((e) => {
      evaluationStepTitles.add(e.title);
    });
  });

  // Get board configuration
  const board = getDefaultBoard({
    storedBoard: proposalBoardBlock as ProposalBoardBlock,
    evaluationStepTitles: Array.from(evaluationStepTitles)
  });

  const viewBlock = blockToFBBlock(proposalViewBlock as ProposalBoardBlock) as BoardView;

  // Convert proposals to cards
  let cards = proposals.map((p) => mapProposalToCard({ proposal: p, spaceId }));

  // Apply filters if they exist
  if (viewBlock.fields.filter) {
    const filteredCardsIds = CardFilter.applyFilterGroup(
      viewBlock.fields.filter,
      [
        ...board.fields.cardProperties,
        {
          id: PROPOSAL_EVALUATION_TYPE_ID,
          name: 'Evaluation Type',
          options: objectUtils.typedKeys(PROPOSAL_STEP_LABELS).map((evaluationType) => ({
            color: 'propColorGray',
            id: evaluationType,
            value: evaluationType
          })),
          type: 'proposalEvaluationType'
        }
      ],
      cards as Card[]
    ).map((c) => c.id);

    cards = cards.filter((cp) => filteredCardsIds.includes(cp.id));
  }

  const cardTitles: Record<string, { title: string }> = cards.reduce<Record<string, { title: string }>>((acc, c) => {
    acc[c.id] = { title: c.title };
    return acc;
  }, {});

  // Sort cards
  if (viewBlock.fields.sortOptions?.length) {
    cards = sortCards(cards as Card[], board, viewBlock, membersRecord, cardTitles);
  }

  // Get visible properties
  const visibleProperties = board.fields.cardProperties.filter(
    (prop) => !viewBlock.fields.visiblePropertyIds || viewBlock.fields.visiblePropertyIds.includes(prop.id)
  );

  // Add title property if not present
  const titleProperty = visibleProperties.find((prop) => prop.id === Constants.titleColumnId);
  if (!titleProperty) {
    visibleProperties.unshift({
      id: Constants.titleColumnId,
      name: 'Title',
      type: 'text',
      options: [],
      readOnly: true
    });
  }

  // Generate CSV data
  const csvData = cards.map((card) => {
    return visibleProperties.reduce<Record<string, string>>((acc, prop) => {
      const value = prop.id === Constants.titleColumnId ? card.title : card.fields.properties[prop.id];
      const displayValue = OctoUtils.propertyDisplayValue({
        block: card,
        propertyValue: value as string,
        propertyTemplate: prop,
        formatters: {
          date: formatDate,
          dateTime: formatDateTime
        },
        context: {
          spaceDomain: space.domain,
          users: membersRecord
        }
      });

      acc[prop.name] = Array.isArray(displayValue) ? displayValue.join(', ') : String(displayValue || '');
      return acc;
    }, {});
  });

  const csvContent = stringify(csvData, {
    header: true,
    delimiter: '\t'
  });

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
