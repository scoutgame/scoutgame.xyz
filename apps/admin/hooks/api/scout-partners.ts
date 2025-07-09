import type { ScoutPartner } from '@charmverse/core/prisma';
import { usePOST, usePUT } from '@packages/scoutgame-ui/hooks/helpers';
import useSWR from 'swr';

import type { CreateScoutPartnerPayload } from 'lib/scout-partners/createScoutPartnerSchema';
import type { EditScoutPartnerPayload } from 'lib/scout-partners/editScoutPartnerSchema';
import type { ScoutPartnerWithRepos } from 'lib/scout-partners/getScoutPartners';

type UploadTokenResponse = {
  token: {
    Credentials: {
      AccessKeyId: string;
      SecretAccessKey: string;
    };
  };
  bucket: string;
  key: string;
  region: string;
};

export function useCreateScoutPartner() {
  return usePOST<CreateScoutPartnerPayload, ScoutPartnerWithRepos>('/api/scout-partners');
}

export function useEditScoutPartner(id: string) {
  return usePUT<EditScoutPartnerPayload, ScoutPartnerWithRepos>(`/api/scout-partners?id=${id}`);
}

export function useGetScoutPartnerUploadToken() {
  return usePOST<{ filename: string }, UploadTokenResponse>('/api/scout-partners/upload-token');
}

export function useScoutPartners() {
  const { data, error, isLoading } = useSWR<ScoutPartner[]>('/api/scout-partners');
  return { data, error, isLoading };
}

export function useS3Upload() {
  const { trigger } = useGetScoutPartnerUploadToken();
  return {
    getUploadToken: async (file: File) => {
      return trigger({ filename: file.name });
    }
  };
}
