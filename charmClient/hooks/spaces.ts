import type { PaymentMethod } from '@charmverse/core/prisma';

import type { WorkflowTemplate } from 'lib/proposal/workflows/interfaces';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

import type { MaybeString } from './helpers';
import { useDELETE, useGETImmutable, useGET, usePOST } from './helpers';

export function useSearchByDomain(domain: MaybeString) {
  return useGETImmutable<SpaceWithGates>(domain ? `/api/spaces/search-domain` : null, {
    search: stripUrlParts(domain || '')
  });
}

export function useGetPaymentMethods(spaceId: MaybeString) {
  return useGETImmutable<PaymentMethod[]>(spaceId ? `/api/payment-methods` : null, {
    spaceId
  });
}

export function useGetProposalWorkflows(spaceId: MaybeString) {
  return useGETImmutable<WorkflowTemplate[]>(spaceId ? `/api/spaces/${spaceId}/proposals/workflows` : null);
}

export function useUpsertProposalWorkflow(spaceId: MaybeString) {
  return usePOST<WorkflowTemplate>(`/api/spaces/${spaceId}/proposals/workflows`);
}

export function useDeleteProposalWorkflow(spaceId: MaybeString) {
  return useDELETE<{ workflowId: string }>(`/api/spaces/${spaceId}/proposals/workflows`);
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}
