import * as yup from 'yup';

export const checkPartnerRewardEligibilitySchema = yup.object({
  payoutContractId: yup.string().required().uuid()
});
