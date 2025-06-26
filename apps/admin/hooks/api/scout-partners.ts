import type { ScoutPartner } from '@charmverse/core/prisma';
import { usePOST, usePUT } from '@packages/scoutgame-ui/hooks/helpers';
import useSWR from 'swr';

import type { CreateScoutPartnerPayload } from 'lib/scout-partners/createScoutPartnerSchema';
import type { EditScoutPartnerPayload } from 'lib/scout-partners/editScoutPartnerSchema';

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
  return usePOST<CreateScoutPartnerPayload, ScoutPartner>('/api/scout-partners');
}

export function useEditScoutPartner(id: string) {
  return usePUT<EditScoutPartnerPayload, ScoutPartner>(`/api/scout-partners/${id}`);
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
