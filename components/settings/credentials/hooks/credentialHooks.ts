import type { CredentialTemplate } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGET } from 'charmClient/hooks/helpers';
import type { PublishedSignedCredential } from 'lib/credentials/config/queriesAndMutations';

export function useGetUserCredentials(data: { account: MaybeString }) {
  return useGET<PublishedSignedCredential[]>(data.account ? '/api/credentials' : null, data);
}
export function useGetCredentialTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<CredentialTemplate[]>(spaceId ? `/api/credentials/templates?spaceId=${spaceId}` : null);
}
