import * as yup from 'yup';

export const saveOnboardingDetailsSchema = yup.object({
  agreedToTOS: yup.bool().required('Terms are Required').oneOf([true], 'You need to accept the terms and conditions.'),
  sendMarketing: yup.bool(),
  avatar: yup.string(),
  displayName: yup.string().required('Display name is required'),
  bio: yup.string()
});

export type SaveOnboardingDetailsFormValues = yup.InferType<typeof saveOnboardingDetailsSchema>;
