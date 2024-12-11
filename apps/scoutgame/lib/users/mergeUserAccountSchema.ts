import * as yup from 'yup';

export const mergeUserAccountSchema = yup.object({
  farcasterId: yup.number().optional(),
  telegramId: yup.number().optional(),
  signature: yup.string().required(),
  nonce: yup.string().required(),
  message: yup.string().required()
});
