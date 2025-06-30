import * as yup from 'yup';

export const updateUserEmailSettingsSchema = yup.object({
  email: yup.string().email('Invalid email address')
});

export type UpdateUserEmailSettingsFormValues = yup.InferType<typeof updateUserEmailSettingsSchema>;
