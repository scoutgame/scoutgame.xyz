import { authActionClient } from '@charmverse/nextjs/actions/actionClient';
import * as yup from 'yup';

import { registerForMatchup, isValidRegistrationWeek } from './registerForMatchup';

const registerForMatchupSchema = yup.object({
  week: yup
    .string()
    .required()
    .test('isValidWeek', 'Invalid week', (value) => isValidRegistrationWeek(value))
});

export const registerForMatchupAction = authActionClient
  .schema(registerForMatchupSchema)
  .action(async ({ week }, { ctx }) => {
    const result = await registerForMatchup(ctx.session.scoutId, week);
    return result;
  });
