import * as yup from 'yup';

export const updateUserEmailSettingsSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  sendTransactionEmails: yup.boolean().required('Send transaction emails is required')
});

export type UpdateUserEmailSettingsFormValues = yup.InferType<typeof updateUserEmailSettingsSchema>;
