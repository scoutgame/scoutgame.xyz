import * as yup from 'yup';

export const mergeUserTelegramAccountSchema = yup.object({
  initData: yup.string().required(),
  profileToKeep: yup.string().oneOf(['current', 'new']).required()
});
