import { authSchema } from '@packages/farcaster/config';
import * as yup from 'yup';

export const mergeUserFarcasterAccountSchema = yup.object({
  authData: authSchema.required(),
  selectedProfile: yup.string().oneOf(['current', 'new']).nullable()
});
