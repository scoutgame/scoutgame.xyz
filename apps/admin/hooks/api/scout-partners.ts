import type { ScoutPartner } from '@charmverse/core/prisma';
import { usePOST } from '@packages/scoutgame-ui/hooks/helpers';
import useSWR from 'swr';

type CreateScoutPartnerPayload = {
  id: string;
  name: string;
  icon: string;
  bannerImage: string;
  infoPageImage: string;
  tokenAmountPerPullRequest?: number;
  tokenAddress?: string;
  tokenChain?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenImage?: string;
};

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

export function useGetScoutPartnerUploadToken() {
  return usePOST<{ filename: string }, UploadTokenResponse>('/api/scout-partners/upload-token');
}

export function useScoutPartners() {
  return useSWR<ScoutPartner[]>('/api/scout-partners');
}

export function useS3Upload() {
  const { trigger } = useGetScoutPartnerUploadToken();
  return {
    getUploadToken: async (file: File) => {
      return trigger({ filename: file.name });
    }
  };
}
