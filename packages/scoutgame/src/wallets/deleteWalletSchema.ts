import * as yup from 'yup';

export const deleteWalletSchema = yup.object({
  address: yup.string().required()
});

export type WalletAuthData = yup.InferType<typeof deleteWalletSchema>;
