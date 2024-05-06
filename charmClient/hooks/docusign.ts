import type { DocusignEnvelope, DocusignEnvelopeToCreate, DocusignSearch, DocusignTemplate } from 'lib/docusign/api';
import type { PublicDocuSignProfile } from 'lib/docusign/authentication';

import { useGET, usePOST, type MaybeString } from './helpers';

export function useGetDocusignProfile({ spaceId }: { spaceId: MaybeString }) {
  return useGET<PublicDocuSignProfile>(spaceId ? '/api/docusign/profile' : null, { spaceId });
}

export function useGetDocusignTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<{ envelopeTemplates: DocusignTemplate[] }>(spaceId ? '/api/docusign/templates' : null, { spaceId });
}

export function useGetSpaceDocusignEnvelopes({ spaceId }: { spaceId: MaybeString }) {
  return useGET<DocusignEnvelope[]>(spaceId ? '/api/docusign/envelopes' : null, { spaceId });
}

export function useGetSearchSpaceDocusignEnvelopes({ spaceId, ...search }: { spaceId: MaybeString } & DocusignSearch) {
  return useGET<DocusignEnvelope[]>(spaceId ? '/api/docusign/search' : null, { spaceId, ...search });
}

export function usePostCreateEnvelope() {
  return usePOST<{ spaceId: string } & DocusignEnvelopeToCreate, unknown>(`/api/docusign/envelopes`);
}

export function usePostRequestDocusignLink() {
  return usePOST<{ envelopeId: string; spaceId: string }, { url: string }>(`/api/docusign/signature-link`);
}
