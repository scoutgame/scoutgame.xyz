import * as yup from 'yup';

export const createScoutProjectSchema = yup.object({
  avatar: yup.string().required('Avatar is required'),
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  website: yup.string().url('Invalid website URL').required('Website is required'),
  github: yup.string().required('Github is required')
});

export type CreateScoutProjectFormValues = yup.InferType<typeof createScoutProjectSchema>;
