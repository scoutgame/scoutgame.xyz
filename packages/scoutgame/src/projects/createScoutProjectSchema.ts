import * as yup from 'yup';

export const createScoutProjectSchema = yup.object({
  avatar: yup.string(),
  name: yup.string().required('Name is required'),
  description: yup.string(),
  website: yup.string().url('Invalid website URL'),
  github: yup.string().test('github', 'Invalid github URL', (value) => {
    if (!value) return true;
    return value.startsWith('https://github.com/') || value.startsWith('https://github.com/');
  }),
  contracts: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Contract address is required'),
        chainId: yup.number().integer().required('Chain ID is required'),
        deployerAddress: yup.string().required('Deployer address is required')
      })
    )
    .min(0),
  deployers: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Deployer address is required'),
        verifiedAt: yup.date().required('Verified at is required')
      })
    )
    .when('contracts', {
      is: (contracts: any[]) => contracts && contracts.length > 0,
      then: (schema) => schema.min(1, 'At least one deployer is required when contracts are provided'),
      otherwise: (schema) => schema
    }),
  teamMembers: yup
    .array()
    .of(
      yup.object({
        scoutId: yup.string().uuid().required(),
        role: yup.string().required('Role is required').oneOf(['owner', 'member']),
        avatar: yup.string(),
        displayName: yup.string().required('Display name is required')
      })
    )
    .required('Team members are required')
});

export type CreateScoutProjectFormValues = yup.InferType<typeof createScoutProjectSchema>;
