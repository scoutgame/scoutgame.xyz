import type { ScoutPartnerStatus } from '@charmverse/core/prisma';
import * as yup from 'yup';

export const createScoutPartnerSchema = yup.object({
  name: yup.string().required('Name is required'),
  icon: yup.string().required('Icon is required'),
  bannerImage: yup.string().required('Banner image is required'),
  infoPageImage: yup.string().required('Info page image is required'),
  status: yup.string<ScoutPartnerStatus>().oneOf(['active', 'paused', 'completed']).required('Status is required'),
  tokenAmountPerPullRequest: yup.number().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token amount per PR is required'),
    otherwise: (schema) => schema.optional()
  }),
  tokenAddress: yup.string().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token address is required'),
    otherwise: (schema) => schema.optional()
  }),
  tokenChain: yup.number().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token chain is required'),
    otherwise: (schema) => schema.optional()
  }),
  tokenSymbol: yup.string().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token symbol is required'),
    otherwise: (schema) => schema.optional()
  }),
  tokenDecimals: yup.number().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token decimals is required'),
    otherwise: (schema) => schema.optional()
  }),
  tokenImage: yup.string().when('$isTokenEnabled', {
    is: true,
    then: (schema) => schema.required('Token image is required'),
    otherwise: (schema) => schema.optional()
  })
});

export type CreateScoutPartnerPayload = yup.InferType<typeof createScoutPartnerSchema>;
