import * as yup from 'yup';

export const connectWalletAccountSchema = yup.object({
  message: yup.string().required(),
  signature: yup.string().required(),
  inviteCode: yup.string().optional().nullable(),
  referralCode: yup.string().optional().nullable(),
  utmCampaign: yup.string().optional().nullable()
});

export type WalletAuthData = yup.InferType<typeof connectWalletAccountSchema>;
