import * as yup from 'yup';

export const updatePrimaryWalletSchema = yup.object({
  address: yup.string().required()
});

export type WalletAuthData = yup.InferType<typeof updatePrimaryWalletSchema>;
