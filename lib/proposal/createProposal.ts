import type { Prisma, ProposalStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';

import type { IPageWithPermissions } from '../pages';
import { getPagePath } from '../pages';

import { generateSyncProposalPermissions } from './syncProposalPermissions';

type PageProps = 'createdBy' | 'spaceId';
type OptionalPageProps = 'content' | 'contentText' | 'id' | 'title';

type ProposalPageInput = Pick<Prisma.PageUncheckedCreateInput, PageProps> &
  Partial<Pick<Prisma.PageUncheckedCreateInput, OptionalPageProps>>;

type ProposalInput = { reviewers: { roleId?: string; userId?: string }[]; categoryId: string | null };

export async function createProposal(pageProps: ProposalPageInput, proposalProps?: ProposalInput) {
  const { createdBy, spaceId } = pageProps;

  const proposalId = uuid();
  const proposalStatus: ProposalStatus = 'private_draft';

  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, page, workspaceEvent] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy,
        id: proposalId,
        spaceId,
        status: proposalStatus,
        categoryId: proposalProps?.categoryId || null,
        authors: {
          create: {
            userId: createdBy
          }
        },
        ...(proposalProps?.reviewers && {
          reviewers: {
            createMany: {
              data: proposalProps.reviewers
            }
          }
        })
      }
    }),
    createPage({
      data: {
        proposalId,
        contentText: '',
        path: getPagePath(),
        title: '',
        ...pageProps,
        updatedBy: createdBy,
        id: proposalId,
        type: 'proposal'
      }
    }),
    prisma.workspaceEvent.create({
      data: {
        type: 'proposal_status_change',
        meta: {
          newStatus: proposalStatus
        },
        actorId: createdBy,
        pageId: proposalId,
        spaceId
      }
    })
  ]);

  const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId, isNewProposal: true });

  await prisma.$transaction([
    prisma.pagePermission.deleteMany(deleteArgs),
    ...createArgs.map((args) => prisma.pagePermission.create(args))
  ]);

  trackUserAction('new_proposal_created', { userId: createdBy, pageId: page.id, resourceId: proposal.id, spaceId });

  return { page: page as IPageWithPermissions, proposal, workspaceEvent };
}
