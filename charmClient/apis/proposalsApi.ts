import type { ProposalStatus } from '@prisma/client';

import * as http from 'adapters/http';
import type { IPageWithPermissions, PageWithProposal } from 'lib/pages';
import type { ProposalCategoryWithPermissions } from 'lib/permissions/proposals/interfaces';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import type { ListProposalsRequest } from 'lib/proposal/getProposalsBySpace';
import type { ProposalCategory, ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalFlowFlags } from 'lib/proposal/state/transition';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

export class ProposalsApi {
  createProposal({ pageProps, proposalProps }: CreateProposalInput) {
    return http.POST<PageWithProposal>('/api/proposals', { pageProps, proposalProps });
  }

  updateProposal({ proposalId, authors, reviewers, categoryId }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, { authors, reviewers, categoryId });
  }

  getProposal(proposalId: string) {
    return http.GET<ProposalWithUsers>(`/api/proposals/${proposalId}`);
  }

  updateStatus(proposalId: string, newStatus: ProposalStatus) {
    return http.PUT<ProposalWithUsers>(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  getProposalsBySpace({ spaceId, categoryIds }: ListProposalsRequest) {
    return http.POST<ProposalWithUsers[]>(`/api/spaces/${spaceId}/proposals`, { categoryIds });
  }

  getProposalCategories(spaceId: string) {
    return http.GET<ProposalCategoryWithPermissions[]>(`/api/spaces/${spaceId}/proposal-categories`);
  }

  createProposalTemplate({ spaceId }: { spaceId: string }): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/templates', { spaceId });
  }

  createProposalFromTemplate({
    spaceId,
    templateId
  }: Omit<CreateProposalFromTemplateInput, 'createdBy'>): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/from-template', { spaceId, templateId });
  }

  deleteProposalTemplate({ proposalTemplateId }: { proposalTemplateId: string }): Promise<IPageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
  }

  createProposalCategory(spaceId: string, category: Omit<ProposalCategory, 'id' | 'spaceId'>) {
    return http.POST<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories`, { ...category });
  }

  updateProposalCategory(spaceId: string, category: ProposalCategory) {
    return http.PUT<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories/${category.id}`, {
      ...category
    });
  }

  deleteProposalCategory(spaceId: string, categoryId: string) {
    return http.DELETE<{ ok: true }>(`/api/spaces/${spaceId}/proposal-categories/${categoryId}`);
  }

  computeProposalFlowFlags(proposalId: string) {
    return http.GET<ProposalFlowFlags>(`/api/proposals/${proposalId}/compute-flow-flags`);
  }
}
