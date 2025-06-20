'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import { enableMatchupsFeatureFlag } from './config';
import { registerForMatchup, isValidRegistrationWeek } from './registerForMatchup';

const registerForMatchupSchema = yup.object({
  tx: yup
    .object()
    .shape({
      chainId: yup.number().required(),
      hash: yup.string().required()
    })
    .optional(),
  decentTx: yup
    .object()
    .shape({
      chainId: yup.number().required(),
      hash: yup.string().required()
    })
    .optional(),
  week: yup
    .string()
    .required()
    .test('isValidWeek', 'Invalid week', (value) => isValidRegistrationWeek(value))
});

export const registerForMatchupAction = authActionClient
  .schema(registerForMatchupSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (!enableMatchupsFeatureFlag()) {
      throw new Error('Matchup is disabled');
    }
    const result = await registerForMatchup({
      scoutId: ctx.session.scoutId,
      week: parsedInput.week,
      tx: parsedInput.tx,
      decentTx: parsedInput.decentTx
    });

    return { id: result.id, decentTxHash: parsedInput?.decentTx?.hash };
  });
