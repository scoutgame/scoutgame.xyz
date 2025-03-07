import * as yup from 'yup';

export const updateScoutProjectSchema = yup.object({
  projectId: yup.string().uuid().required(),
  avatar: yup.string().notRequired(),
  name: yup.string(),
  description: yup.string().notRequired(),
  website: yup.string().url('Invalid website URL').notRequired(),
  github: yup
    .string()
    .test('github', 'Invalid github URL', (value) => {
      if (!value) return true;
      return value.startsWith('https://github.com/') || value.startsWith('https://github.com/');
    })
    .notRequired(),
  contracts: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Contract address is required'),
        chainId: yup.number().integer().required('Chain ID is required'),
        deployerAddress: yup.string().required('Deployer address is required')
      })
    )
    .min(0)
    .required('Contracts are required'),
  deployers: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Deployer address is required'),
        // If we are passing an already verified deployer, signature is not required
        signature: yup.string().nullable(),
        verified: yup.boolean().required()
      })
    )
    .test('deployer-signature', 'Every deployer must have a signature', (deployers) => {
      // Non-verified deployers must have a signature, verified deployers were fetched from the database
      return deployers
        ? deployers.filter((deployer) => !deployer.verified).every((deployer) => deployer.signature)
        : true;
    })
    .when('contracts', {
      is: (contracts: any[]) => contracts && contracts.length > 0,
      then: (schema) => schema.min(1, 'At least one deployer is required when contracts are provided'),
      otherwise: (schema) => schema
    })
    .required('Contracts are required'),
  solanaWallets: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Wallet address is required'),
        verified: yup.boolean().required()
      })
    )
    .min(0)
    .required('SolanaWallets are required'),
  wallets: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Wallet address is required'),
        chainId: yup.number().integer().required('Chain ID is required'),
        signature: yup.string().optional(),
        verified: yup.boolean().required()
      })
    )
    .min(0)
    .required('Wallets are required'),
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
    .min(1, 'At least one team member is required')
    .required('Team members are required')
});

export type UpdateScoutProjectFormValues = yup.InferType<typeof updateScoutProjectSchema>;
