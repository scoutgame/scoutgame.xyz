import * as yup from 'yup';

export const mergeUserFarcasterAccountSchema = yup.object({
  signature: yup.string().required(),
  nonce: yup.string().required(),
  message: yup.string().required(),
  profileToKeep: yup.string().oneOf(['current', 'new']).required()
});
