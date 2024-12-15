import * as yup from 'yup';

export const connectTelegramAccountSchema = yup.object({
  hash: yup.string().required(),
  auth_date: yup.number().required(),
  id: yup.number().required(),
  first_name: yup.string(),
  last_name: yup.string(),
  username: yup.string(),
  photo_url: yup.string()
});
