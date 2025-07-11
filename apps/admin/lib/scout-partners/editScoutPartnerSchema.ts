import type { ScoutPartnerStatus } from '@charmverse/core/prisma';
import * as yup from 'yup';

export const editScoutPartnerSchema = yup.object().shape({
  status: yup.string<ScoutPartnerStatus>().oneOf(['active', 'paused', 'completed']).required('Status is required'),
  tokenAmountPerPullRequest: yup.number().optional(),
  issueTagTokenAmounts: yup
    .array()
    .of(
      yup.object().shape({
        tag: yup.string().required('Tag is required'),
        amount: yup.number().required('Amount is required').positive()
      })
    )
    .required()
    .default([]),
  repoIds: yup.array().of(yup.number().required()).default([])
});

export type EditScoutPartnerPayload = yup.InferType<typeof editScoutPartnerSchema>;
