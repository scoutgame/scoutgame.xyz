import type { Prisma } from '@prisma/client';

import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';

import { createProposal } from './createProposal';
import { getProposal } from './getProposal';

export interface CreateProposalFromTemplateInput {
  spaceId: string;
  createdBy: string;
  templateId: string;
}

export async function createProposalFromTemplate({ createdBy, spaceId, templateId }: CreateProposalFromTemplateInput) {
  const proposalTemplate = await getProposal({ proposalId: templateId });

  if (!proposalTemplate) {
    throw new DataNotFoundError(`Proposal template with id ${templateId} not found`);
  } else if (spaceId !== proposalTemplate.spaceId) {
    throw new InsecureOperationError('You cannot copy proposals from a different space');
  }

  const title = `Copy of ${proposalTemplate.title}`;

  return createProposal({
    pageProps: {
      title,
      contentText: proposalTemplate?.contentText ?? '',
      content: proposalTemplate?.content as Prisma.JsonValue
    },
    userId: createdBy,
    spaceId,
    categoryId: proposalTemplate.proposal?.categoryId as string
  });
}
