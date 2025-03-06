import * as yup from 'yup';

export const updateUserNotificationSettingsSchema = yup.object({
  emailNotification: yup.boolean().required('Email notification is required'),
  farcasterNotification: yup.boolean().required('Farcaster notification is required')
});

export type UpdateUserNotificationSettingsFormValues = yup.InferType<typeof updateUserNotificationSettingsSchema>;
