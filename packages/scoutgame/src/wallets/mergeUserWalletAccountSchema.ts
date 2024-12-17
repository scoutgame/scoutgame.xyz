import * as yup from 'yup';

import { connectWalletAccountSchema } from './connectWalletAccountSchema';

export const mergeUserWalletAccountSchema = yup.object({
  authData: connectWalletAccountSchema.required(),
  selectedProfile: yup.string().oneOf(['current', 'new']).nullable()
});
