import * as yup from 'yup';

export const connectTelegramAccountSchema = yup.object({
  id: yup.string().required()
});
