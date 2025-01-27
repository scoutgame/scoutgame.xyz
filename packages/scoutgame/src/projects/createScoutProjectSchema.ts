import * as yup from 'yup';

export const createScoutProjectSchema = yup.object({
  avatar: yup.string().required('Avatar is required'),
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  website: yup.string().url('Invalid website URL').required('Website is required'),
  github: yup.string().required('Github is required'),
  contracts: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Contract address is required'),
        chainId: yup.number().integer().required('Chain ID is required')
      })
    )
    .min(0),
  teamMembers: yup
    .array()
    .of(
      yup.object({
        scoutId: yup.string().uuid().required(),
        role: yup.string().required('Role is required').oneOf(['owner', 'member']),
        avatar: yup.string().required('Avatar is required'),
        displayName: yup.string().required('Display name is required')
      })
    )
    .required('Team members are required')
});

export type CreateScoutProjectFormValues = yup.InferType<typeof createScoutProjectSchema>;
