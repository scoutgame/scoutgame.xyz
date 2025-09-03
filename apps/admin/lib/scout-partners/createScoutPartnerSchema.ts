import type { ScoutPartnerStatus } from '@charmverse/core/prisma';
import * as yup from 'yup';

export const issueTagAmountSchema = yup.object({
  tag: yup.string().required('Tag is required'),
  amount: yup.number().required('Amount is required').positive()
});

export const createScoutPartnerSchema = yup.object({
  name: yup.string().required('Name is required'),
  icon: yup.string().required('Icon is required'),
  bannerImage: yup.string(),
  infoPageImage: yup.string(),
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
  }),
  issueTagTokenAmounts: yup
    .array()
    .of(issueTagAmountSchema)
    .when('$isTokenEnabled', {
      is: true,
      then: (schema) => schema.default([]),
      otherwise: (schema) => schema.optional()
    }),
  repoIds: yup.array().of(yup.number().required()).default([]),
  // Developers (Scout ids) who should be excluded from partner rewards
  blacklistedDeveloperIds: yup.array().of(yup.string().uuid('Invalid developer id')).default([])
});

export type CreateScoutPartnerPayload = yup.InferType<typeof createScoutPartnerSchema>;
