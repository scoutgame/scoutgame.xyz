import * as yup from 'yup';

import { connectTelegramAccountSchema } from './connectTelegramAccountSchema';

export const mergeUserTelegramAccountSchema = yup.object({
  authData: connectTelegramAccountSchema.required(),
  selectedProfile: yup.string().oneOf(['current', 'new']).nullable()
});
