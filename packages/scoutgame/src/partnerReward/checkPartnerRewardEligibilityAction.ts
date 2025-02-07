'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { checkPartnerRewardEligibility } from './checkPartnerRewardEligibility';
import { checkPartnerRewardEligibilitySchema } from './checkPartnerRewardEligibilitySchema';

export const checkPartnerRewardEligibilityAction = authActionClient
  .metadata({
    actionName: 'check_partner_reward_eligibility'
  })
  .schema(checkPartnerRewardEligibilitySchema)
  .action(async ({ ctx, parsedInput }) => {
    const { payoutContractId } = parsedInput;

    const eligibilityResult = await checkPartnerRewardEligibility({
      payoutContractId,
      scoutId: ctx.session.scoutId
    });
    return eligibilityResult;
  });
