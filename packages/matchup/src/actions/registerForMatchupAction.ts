import { authActionClient } from '@charmverse/nextjs/actions/actionClient';
import * as yup from 'yup';

import { registerForMatchup } from '../registerForMatchup';

const registerForMatchupSchema = yup.object({
  week: yup.number().required().min(1)
});

export const registerForMatchupAction = authActionClient
  .schema(registerForMatchupSchema)
  .action(async ({ week }, { ctx }) => {
    const result = await registerForMatchup(ctx.session.scoutId, week);
    return { success: true, data: result };
  });
