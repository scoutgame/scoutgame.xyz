import * as yup from 'yup';

export const checkAirdropEligibilitySchema = yup.object({
  payoutContractId: yup.string().required().uuid()
});
