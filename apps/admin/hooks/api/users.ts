import type { BuilderStatus } from '@charmverse/core/prisma';
import { useGETImmutable, useGET, usePOST } from '@packages/scoutgame-ui/hooks/helpers';

import type { CreateBuilderParams } from 'lib/users/createBuilder';
import type { UserResult } from 'lib/users/getUser';
import type { ScoutGameUser, SortField, SortOrder } from 'lib/users/getUsers';
import type { SearchUserResult } from 'lib/users/searchForUser';

export function useSearchUsers({
  searchString,
  sortField,
  sortOrder,
  builderStatus
}: {
  searchString?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  builderStatus?: BuilderStatus;
}) {
  return useGETImmutable<ScoutGameUser[]>(searchString || sortField || builderStatus ? '/api/users' : null, {
    searchString,
    sortField,
    sortOrder,
    builderStatus
  });
}

export function useSearchForUser(searchString?: string, skipFarcaster: boolean = false) {
  return useGET<SearchUserResult | null>(searchString ? '/api/users/search-for-user' : null, {
    searchString,
    skipFarcaster
  });
}

export function useGetUser(userId?: string) {
  return useGET<UserResult | null>(userId ? '/api/users/get-user' : null, { userId });
}

export function useCreateBuilder() {
  return usePOST<CreateBuilderParams>('/api/users/create-builder');
}

export function useCreateUser() {
  return usePOST<{ searchString: string }>('/api/users');
}
