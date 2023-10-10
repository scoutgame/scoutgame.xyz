import type { Proposal } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Card, CardFields } from 'lib/focalboard/card';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedProposalBlocksCount = {
  proposalViews: number;
  proposalProperties: number;
  proposalPropertyValues: number;
  proposalCategories: number; // added this line
};

export type ProposalBlocksCount = GenericBlocksCount<DetailedProposalBlocksCount>;

export async function countProposalBlocks({ spaceId, batchSize }: BlocksCountQuery): Promise<ProposalBlocksCount> {
  const detailedCount: ProposalBlocksCount = {
    total: 0,
    details: {
      proposalViews: 0,
      proposalProperties: 0,
      proposalPropertyValues: 0,
      proposalCategories: 0 // added this line
    }
  };

  // 1 - Count views
  detailedCount.details.proposalViews = await prisma.proposalBlock.count({
    where: { spaceId, type: 'view' }
  });

  // 2 - Count categories
  detailedCount.details.proposalCategories = await prisma.proposalCategory.count({
    where: { spaceId } // assuming proposalCategory has a spaceId field
  });

  // Retrieve the single proposal board block for the space
  const proposalBlockRecord = await prisma.proposalBlock.findFirst({
    where: {
      type: 'board',
      spaceId
    },
    select: {
      fields: true
    }
  });

  if (!proposalBlockRecord) {
    // No proposal board block found, return the initial detailed count
    return detailedCount;
  }

  // 2 - Get schema for the proposal block
  const proposalSchema = (proposalBlockRecord.fields as any).cardProperties?.reduce(
    (acc: Record<string, IPropertyTemplate>, prop: IPropertyTemplate) => {
      acc[prop.id] = prop;
      return acc;
    },
    {} as Record<string, IPropertyTemplate>
  );

  detailedCount.details.proposalProperties = Object.keys(proposalSchema).length;

  // 3 - Count proposal property values
  const proposalPropertyValues = await paginatedPrismaTask({
    batchSize,
    model: 'proposal',
    queryOptions: {
      where: {
        spaceId,
        page: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        fields: true
      }
    },
    reducer: _sum,
    callback: (proposals: Pick<Proposal, 'fields'>[]) => {
      return proposals.reduce((acc, proposal) => {
        const proposalProps = Object.entries((proposal.fields as CardFields)?.properties ?? {});
        const proposalPropCounts: number = proposalProps.reduce((proposalPropAcc, [propId, propValue]) => {
          const matchingSchema = proposalSchema[propId];
          if ((!propValue && propValue !== 0) || (Array.isArray(propValue) && !propValue.length) || !matchingSchema) {
            return proposalPropAcc;
          }
          return proposalPropAcc + 1;
        }, 0);

        return acc + proposalPropCounts;
      }, 0);
    }
  });

  detailedCount.details.proposalPropertyValues = proposalPropertyValues;

  // Summing up all counts
  detailedCount.total = _sum(Object.values(detailedCount.details));

  return detailedCount;
}
